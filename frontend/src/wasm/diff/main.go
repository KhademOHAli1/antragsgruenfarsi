package main

import (
	"encoding/json"
	"fmt"
	"strings"
	"syscall/js"

	"github.com/sergi/go-diff/diffmatchpatch"
)

// DiffOperation represents a single diff operation
type DiffOperation struct {
	Type string `json:"type"` // "equal", "insert", "delete"
	Text string `json:"text"`
}

// DiffResult represents the result of a diff operation
type DiffResult struct {
	Operations []DiffOperation `json:"operations"`
	Stats      DiffStats       `json:"stats"`
}

// DiffStats provides statistics about the diff
type DiffStats struct {
	Additions int `json:"additions"`
	Deletions int `json:"deletions"`
	Changes   int `json:"changes"`
	Total     int `json:"total"`
}

// LineDiff represents a line-by-line diff result
type LineDiff struct {
	Lines []LineDiffLine `json:"lines"`
	Stats DiffStats      `json:"stats"`
}

// LineDiffLine represents a single line in a diff
type LineDiffLine struct {
	Type      string `json:"type"`      // "equal", "insert", "delete"
	OldNumber int    `json:"oldNumber"` // Line number in old text (-1 if not applicable)
	NewNumber int    `json:"newNumber"` // Line number in new text (-1 if not applicable)
	Content   string `json:"content"`   // Line content
	Changes   []DiffOperation `json:"changes,omitempty"` // Character-level changes within the line
}

var dmp *diffmatchpatch.DiffMatchPatch

func init() {
	dmp = diffmatchpatch.New()
	// Configure for better performance and accuracy
	dmp.DiffTimeout = 0 // No timeout for WASM context
	dmp.DiffEditCost = 4
}

// computeCharDiff computes character-level differences between two texts
func computeCharDiff(oldText, newText string) DiffResult {
	diffs := dmp.DiffMain(oldText, newText, false)
	diffs = dmp.DiffCleanupSemantic(diffs)

	operations := make([]DiffOperation, 0, len(diffs))
	stats := DiffStats{}

	for _, diff := range diffs {
		var opType string
		switch diff.Type {
		case diffmatchpatch.DiffEqual:
			opType = "equal"
		case diffmatchpatch.DiffInsert:
			opType = "insert"
			stats.Additions += len(diff.Text)
			stats.Changes++
		case diffmatchpatch.DiffDelete:
			opType = "delete"
			stats.Deletions += len(diff.Text)
			stats.Changes++
		}

		operations = append(operations, DiffOperation{
			Type: opType,
			Text: diff.Text,
		})
		stats.Total++
	}

	return DiffResult{
		Operations: operations,
		Stats:      stats,
	}
}

// computeLineDiff computes line-by-line differences with character-level details
func computeLineDiff(oldText, newText string) LineDiff {
	oldLines := strings.Split(oldText, "\n")
	newLines := strings.Split(newText, "\n")

	// Create line-based diff
	oldLinesText := strings.Join(oldLines, "\n")
	newLinesText := strings.Join(newLines, "\n")
	
	// Use line mode for better line-by-line tracking
	lineArray := dmp.DiffLinesToChars(oldLinesText, newLinesText)
	diffs := dmp.DiffMain(lineArray.Chars1, lineArray.Chars2, false)
	diffs = dmp.DiffCharsToLines(diffs, lineArray.LineArray)
	diffs = dmp.DiffCleanupSemantic(diffs)

	lines := make([]LineDiffLine, 0)
	stats := DiffStats{}
	oldLineNum := 1
	newLineNum := 1

	for _, diff := range diffs {
		diffLines := strings.Split(diff.Text, "\n")
		if len(diffLines) > 0 && diffLines[len(diffLines)-1] == "" {
			diffLines = diffLines[:len(diffLines)-1] // Remove empty last line
		}

		for i, line := range diffLines {
			var lineType string
			var oldNum, newNum int

			switch diff.Type {
			case diffmatchpatch.DiffEqual:
				lineType = "equal"
				oldNum = oldLineNum
				newNum = newLineNum
				oldLineNum++
				newLineNum++

			case diffmatchpatch.DiffInsert:
				lineType = "insert"
				oldNum = -1
				newNum = newLineNum
				newLineNum++
				stats.Additions++

			case diffmatchpatch.DiffDelete:
				lineType = "delete"
				oldNum = oldLineNum
				newNum = -1
				oldLineNum++
				stats.Deletions++
			}

			diffLine := LineDiffLine{
				Type:      lineType,
				OldNumber: oldNum,
				NewNumber: newNum,
				Content:   line,
			}

			// For changed lines, compute character-level diff
			if lineType != "equal" && i < len(diffLines)-1 {
				// Try to find corresponding line in the other text for character-level diff
				if lineType == "insert" && len(oldLines) > oldLineNum-1 {
					charDiff := computeCharDiff(oldLines[oldLineNum-1], line)
					diffLine.Changes = charDiff.Operations
				} else if lineType == "delete" && len(newLines) > newLineNum-1 {
					charDiff := computeCharDiff(line, newLines[newLineNum-1])
					diffLine.Changes = charDiff.Operations
				}
			}

			lines = append(lines, diffLine)
			stats.Total++
		}

		if diff.Type != diffmatchpatch.DiffEqual {
			stats.Changes++
		}
	}

	return LineDiff{
		Lines: lines,
		Stats: stats,
	}
}

// computePatch computes a patch that can transform oldText to newText
func computePatch(oldText, newText string) string {
	patches := dmp.PatchMake(oldText, newText)
	return dmp.PatchToText(patches)
}

// applyPatch applies a patch to text
func applyPatch(text, patch string) map[string]interface{} {
	patches, err := dmp.PatchFromText(patch)
	if err != nil {
		return map[string]interface{}{
			"success": false,
			"error":   err.Error(),
		}
	}

	results := dmp.PatchApply(patches, text)
	
	return map[string]interface{}{
		"success": true,
		"text":    results[0],
		"applied": results[1],
	}
}

// JavaScript bridge functions
func charDiffWrapper() js.Func {
	return js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		if len(args) != 2 {
			return map[string]interface{}{
				"error": "Expected 2 arguments: oldText, newText",
			}
		}

		oldText := args[0].String()
		newText := args[1].String()

		result := computeCharDiff(oldText, newText)
		
		// Convert to JavaScript-compatible format
		jsResult, _ := json.Marshal(result)
		return js.Global().Get("JSON").Call("parse", string(jsResult))
	})
}

func lineDiffWrapper() js.Func {
	return js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		if len(args) != 2 {
			return map[string]interface{}{
				"error": "Expected 2 arguments: oldText, newText",
			}
		}

		oldText := args[0].String()
		newText := args[1].String()

		result := computeLineDiff(oldText, newText)
		
		// Convert to JavaScript-compatible format
		jsResult, _ := json.Marshal(result)
		return js.Global().Get("JSON").Call("parse", string(jsResult))
	})
}

func patchWrapper() js.Func {
	return js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		if len(args) != 2 {
			return map[string]interface{}{
				"error": "Expected 2 arguments: oldText, newText",
			}
		}

		oldText := args[0].String()
		newText := args[1].String()

		patch := computePatch(oldText, newText)
		
		return map[string]interface{}{
			"patch": patch,
		}
	})
}

func applyPatchWrapper() js.Func {
	return js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		if len(args) != 2 {
			return map[string]interface{}{
				"error": "Expected 2 arguments: text, patch",
			}
		}

		text := args[0].String()
		patch := args[1].String()

		return applyPatch(text, patch)
	})
}

func main() {
	fmt.Println("Go WebAssembly Diff Module Initialized")

	// Export functions to JavaScript global scope
	js.Global().Set("goDiffChar", charDiffWrapper())
	js.Global().Set("goDiffLine", lineDiffWrapper())
	js.Global().Set("goPatch", patchWrapper())
	js.Global().Set("goApplyPatch", applyPatchWrapper())

	// Keep the program running
	select {}
}
