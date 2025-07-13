<?php
// Simple test script to validate Farsi translation files

$messagesDir = __DIR__ . '/messages/fa/';

// List of all translation files that should exist
$translationFiles = [
    'base.php',
    'admin.php', 
    'structure.php',
    'motion.php',
    'amend.php',
    'user.php',
    'consultation.php',
    'speech.php',
    'export.php',
    'manager.php',
    'diff.php',
    'voting.php',
    'pages.php',
    'comment.php',
    'initiator.php',
    'wizard.php'
];

echo "Testing Farsi translation files...\n\n";

$totalKeys = 0;
$errors = [];

foreach ($translationFiles as $file) {
    $filePath = $messagesDir . $file;
    
    if (!file_exists($filePath)) {
        $errors[] = "Missing file: $file";
        continue;
    }
    
    // Try to load the file
    try {
        $translations = include $filePath;
        
        if (!is_array($translations)) {
            $errors[] = "File $file does not return an array";
            continue;
        }
        
        $keyCount = count($translations);
        $totalKeys += $keyCount;
        
        echo "✓ $file: $keyCount translation keys loaded successfully\n";
        
        // Check for some basic translations
        if ($file === 'base.php') {
            $requiredKeys = ['save', 'edit', 'Home', 'menu_login', 'menu_logout'];
            foreach ($requiredKeys as $key) {
                if (!isset($translations[$key])) {
                    $errors[] = "Missing required key '$key' in $file";
                }
            }
        }
        
    } catch (Exception $e) {
        $errors[] = "Error loading $file: " . $e->getMessage();
    }
}

echo "\n" . str_repeat("=", 50) . "\n";
echo "SUMMARY:\n";
echo "Total translation files: " . count($translationFiles) . "\n";
echo "Total translation keys: $totalKeys\n";

if (empty($errors)) {
    echo "✅ All Farsi translation files are valid!\n";
} else {
    echo "❌ Found " . count($errors) . " errors:\n";
    foreach ($errors as $error) {
        echo "  - $error\n";
    }
}

echo "\nSample translations from base.php:\n";
$baseTranslations = include $messagesDir . 'base.php';
$sampleKeys = ['save', 'edit', 'Home', 'menu_login', 'menu_logout'];
foreach ($sampleKeys as $key) {
    if (isset($baseTranslations[$key])) {
        echo "  $key: " . $baseTranslations[$key] . "\n";
    }
}

echo "\n";
