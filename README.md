# Antragsgrün - Farsi (Persian) Language Support

This repository contains a fork of [Antragsgrün](https://github.com/CatoTH/antragsgruen) with comprehensive **Farsi (Persian) language support** and a **modern, Swiss-design inspired wizard interface**.

## Original Antragsgrün

Antragsgrün is an easy-to-use online tool for NGOs, political parties, and social initiatives to collaboratively discuss resolutions, party platforms, and amendments. It helps to manage candidacies and supports meetings by providing online votings, speaking lists, and many more features.

A number of organisations are using the tool successfully such as the federal association of the European and German Green Party, the German Federal Youth Council, the European Youth Forum or the National Council of German Women's Organizations.
It can be easily adapted to a variety of scenarios.

Core functions:
- Submit motions, proposals and discussion papers online
- Clear amendming process for users and administrators
- Discuss motions
- Draft resolutions
- Votings
- Speaking lists
- Diverse export options
- Great flexibility - it adapts to a lot of different use cases
- Technically mature, data privacy-friendly
- Accessible, following WCAG AA

## 🌟 What's New in This Fork

### 🌐 Complete Farsi Language Support
- **Full translation** of all user interface elements
- **Native RTL (Right-to-Left)** text support
- **Cultural adaptation** of text and layout for Persian speakers
- **16 comprehensive translation files** covering all application areas

### 🎨 Modern Swiss-Design Interface
- **Clean, minimalist design** following Swiss design principles
- **Modern typography** using Helvetica Neue font family
- **Smooth animations** and transitions for better user experience
- **Responsive design** that works perfectly on mobile and desktop

### ✨ Enhanced Wizard Experience
- **Step-by-step navigation** with visual progress indicators
- **Icon system overhaul** - replaced broken icon fonts with reliable Unicode symbols
- **Accessibility improvements** with ARIA attributes and keyboard navigation
- **Form validation** with clean, intuitive feedback

## 🚀 Key Features

### Language Support
- ✅ **Complete Farsi UI** - Every button, label, and message translated
- ✅ **RTL Layout** - Proper right-to-left text flow and element positioning
- ✅ **Persian Typography** - Optimal font rendering for Farsi text
- ✅ **Cultural Localization** - Text adapted for Persian-speaking users

### User Interface
- ✅ **Swiss Design Principles** - Clean, functional, elegant
- ✅ **Modern Color Palette** - GitHub-inspired professional colors
- ✅ **Grid-based Layout** - Organized, scannable content presentation
- ✅ **Smooth Animations** - 0.15s transitions for polished interactions

### Technical Improvements
- ✅ **Performance Optimized** - Only active wizard steps are rendered
- ✅ **Icon Compatibility** - Unicode symbols replace problematic icon fonts
- ✅ **Cross-browser Support** - Consistent experience across all browsers
- ✅ **Mobile Responsive** - Perfect experience on all device sizes

## 📁 File Structure

### New Files Added
```
web/css/
├── modern-wizard.css      # Swiss-design wizard styles
└── rtl-support.css       # Comprehensive RTL support

web/js/
├── swiss-wizard.js       # Modern wizard functionality
└── wizard-improvements.js # Legacy wizard enhancements

messages/fa/              # Persian translations
├── base.php             # Core interface elements
├── wizard.php           # Installation wizard
├── motion.php           # Proposals and motions
├── amend.php            # Amendments
├── user.php             # User management
├── admin.php            # Administration panel
├── structure.php        # Site structure
├── consultation.php     # Consultation management
├── speech.php           # Speaker lists
├── export.php           # Export functionality
├── manager.php          # Site management
├── diff.php             # Text differences
├── voting.php           # Voting system
├── pages.php            # Static pages
├── comment.php          # Comments system
└── initiator.php        # Motion initiators
```

### Modified Files
```
views/layouts/main.php    # Added conditional CSS/JS loading
components/yii/MessageSource.php # Registered Farsi language
```

## 🛠 Installation & Setup

### Prerequisites
- PHP 8.1+
- MySQL/MariaDB
- Composer
- Docker (optional, for development)

### Quick Start
1. **Clone this repository:**
   ```bash
   git clone https://github.com/KhademOHAli1/antragsgruenfarsi.git
   cd antragsgruenfarsi
   ```

2. **Install dependencies:**
   ```bash
   composer install
   ```

3. **Set up environment:**
   ```bash
   cp config/config.template.json config/config.json
   # Edit config.json with your database settings
   ```

4. **Run with Docker (recommended):**
   ```bash
   docker-compose up -d
   ```

5. **Access the application:**
   - Open http://localhost:12380
   - Select "فارسی" (Farsi) as your language
   - Follow the installation wizard

## 🎯 Design Philosophy

### Swiss Design Principles Applied
- **Minimal Visual Elements** - Clean, uncluttered interface
- **Grid-based Layout** - Structured, organized content presentation
- **Helvetica Typography** - Clear, readable text hierarchy
- **Functional Color Use** - Colors serve purpose, not decoration
- **White Space Emphasis** - Strategic spacing for visual breathing room

### RTL Language Considerations
- **Natural Text Flow** - Right-to-left reading pattern
- **Mirrored Layouts** - Navigation and controls positioned for RTL users
- **Cultural Adaptation** - UI patterns familiar to Persian speakers
- **Bi-directional Support** - Seamless LTR content within RTL layout

## 🔧 Technical Details

### CSS Architecture
- **Modern CSS Grid** - Flexible, responsive layouts
- **CSS Custom Properties** - Consistent theming system
- **Progressive Enhancement** - Works without JavaScript
- **Mobile-first Approach** - Responsive design from ground up

### JavaScript Features
- **Vanilla JavaScript** - No framework dependencies
- **Event Delegation** - Efficient event handling
- **Keyboard Navigation** - Full accessibility support
- **Auto-save Functionality** - User data preservation

### Performance Optimizations
- **Conditional Asset Loading** - Only load what's needed
- **Optimized Animations** - Hardware-accelerated transitions
- **Efficient DOM Manipulation** - Minimal reflows and repaints
- **Smart Caching** - Browser cache optimization

## 🧪 Testing

The repository includes comprehensive testing tools:

```bash
# Test translation files
php test_translations.php

# View test reports
open farsi_test_report.html
open test_farsi_translations.html
```

## 📱 Browser Support

- ✅ **Chrome/Chromium** 90+
- ✅ **Firefox** 88+
- ✅ **Safari** 14+
- ✅ **Edge** 90+
- ✅ **Mobile browsers** (iOS Safari, Chrome Mobile)

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Translation Guidelines
- Use natural, conversational Farsi
- Maintain consistency with existing translations
- Consider cultural context and Persian UI conventions
- Test RTL layout after changes

### Code Style
- Follow existing CSS/JS patterns
- Use meaningful variable and class names
- Comment complex logic
- Ensure mobile responsiveness

## 🙏 Acknowledgments

- **Original Antragsgrün team** for creating this excellent platform
- **Swiss design movement** for inspiring the clean, functional aesthetic
- **Persian typography experts** for guidance on proper Farsi text rendering
- **Open source community** for tools and inspiration

## 📞 Support

For questions, issues, or contributions:
- Open an issue in this repository
- Contact the maintainers
- Check the original [Antragsgrün documentation](https://github.com/CatoTH/antragsgruen)

---

**Made with ❤️ for the Persian-speaking community**

[![Yii2](https://img.shields.io/badge/Powered_by-Yii_Framework-green.svg?style=flat)](https://www.yiiframework.com/)
