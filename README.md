# YUV.AI SocialBot Pro - Smart Auto Engager

**FLY HIGH WITH YUV.AI**

An advanced AI-powered Chrome extension for intelligent social media automation on LinkedIn and Facebook, featuring comprehensive analytics and Cohere LLM integration.

![YUV.AI SocialBot Pro](icons/icon128.png)

## 🚀 Features

### 🤖 AI-Powered Automation
- **Smart Auto-Likes**: Automatic liking with customizable delays (1.5 seconds)
- **Intelligent Comments**: AI-generated contextual comments using Cohere's latest models
- **Heart Reactions**: Preference option for LinkedIn heart reactions ❤️ over regular likes 👍
- **Language Detection**: Automatically detects post language and responds appropriately
- **Multi-Platform Support**: LinkedIn and Facebook integration

### 🎭 Persona Management
- **Custom Personas**: Create and manage multiple AI personas with unique personalities
- **Writing Examples**: Train the AI with your writing style examples
- **Tone Customization**: Define personality traits and communication styles
- **Context-Aware Responses**: AI adapts responses based on selected persona

### 📊 Advanced Analytics Dashboard
- **Real-Time Statistics**: Live tracking of likes, comments, and engagement
- **Interactive Charts**: Beautiful visualizations powered by Chart.js
- **Time-Range Analysis**: View data for last week, month, quarter, or year
- **Platform Breakdown**: Detailed analytics per social media platform
- **Export Capabilities**: Download data in CSV or JSON formats
- **Activity Feed**: Real-time activity monitoring

### 🌐 Multi-Language Support
- **Hebrew (עברית)**: Full RTL support with native Hebrew interface
- **English**: Complete English localization
- **Dynamic Switching**: Switch languages on-the-fly with flag buttons 🇮🇱 🇺🇸

### 🔧 Advanced Features
- **Manual Controls**: Trigger likes and comments manually from dashboard
- **Session Tracking**: Monitor active usage time and patterns
- **Error Handling**: Comprehensive error tracking and reporting
- **Data Management**: Clean old data, reset statistics, export analytics
- **Real-Time Updates**: Live dashboard updates every 5 seconds

## 🛠️ Installation

### From Chrome Web Store (Recommended)
*Coming Soon - Currently in development*

### Manual Installation (Developer Mode)
1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The extension icon will appear in your toolbar

## ⚙️ Setup & Configuration

### 1. API Key Setup
1. Get your Cohere API key from [Cohere Dashboard](https://dashboard.cohere.com/)
2. Click the extension icon and enter your API key
3. The extension will validate the connection automatically

### 2. Persona Configuration
1. Open the extension popup
2. Navigate to "Persona Management" section
3. Create custom personas with:
   - Unique names and descriptions
   - Writing style examples
   - Personality traits and tone

### 3. Automation Settings
1. Enable desired automation features:
   - Auto-likes with customizable timing
   - Auto-comments with AI generation
   - Platform preferences (LinkedIn/Facebook)
2. Click "Save Automation Settings" to activate

### 4. Analytics Dashboard
1. Click "Open Detailed Analytics Dashboard"
2. View comprehensive statistics and insights
3. Use manual controls for targeted engagement
4. Export data for external analysis

## 🔑 API Integration

### Cohere API v2 Compliance
- Full compatibility with Cohere's latest API version
- Streaming response support for real-time generation
- Advanced prompt engineering for contextual responses
- Error handling and retry mechanisms

### Supported Models
- `command-a-03-2025` (Latest Cohere model)
- Automatic model selection and optimization
- Custom temperature and token limits

## 📱 Platform Support

### LinkedIn
- ✅ Auto-likes with heart reaction preference
- ✅ AI-generated comments with language detection
- ✅ Post content analysis and context awareness
- ✅ Thread reply support
- ✅ Manual engagement controls

### Facebook
- ✅ Basic like automation
- ✅ Comment generation (limited)
- 🔄 Enhanced features coming soon

## 📊 Analytics Features

### Dashboard Metrics
- **Total Engagement**: Likes, comments, posts viewed
- **Platform Distribution**: Activity breakdown by platform
- **Time Analysis**: Daily, weekly, monthly trends
- **Engagement Rate**: Calculated engagement percentages
- **Session Tracking**: Active usage time monitoring

### Data Visualization
- **Line Charts**: Activity trends over time
- **Doughnut Charts**: Platform and engagement distribution
- **Bar Charts**: Comment length analysis
- **Real-time Updates**: Live activity feed

### Export Options
- **CSV Format**: Spreadsheet-compatible data export
- **JSON Format**: Developer-friendly structured data
- **Comprehensive Reports**: Full analytics with metadata

## 🔒 Privacy & Security

### Data Storage
- All data stored locally using Chrome's storage API
- No external data transmission except to Cohere API
- User has full control over data deletion and export

### API Security
- Secure API key storage with Chrome's encrypted storage
- HTTPS-only communication with Cohere API
- No logging of sensitive user data

### Permissions
- `storage`: For saving settings and analytics data
- `activeTab`: For interacting with current social media pages
- `scripting`: For injecting automation scripts
- `tabs`: For opening analytics dashboard

## 🚀 Development

### Tech Stack
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Charts**: Chart.js with date adapters
- **Database**: IndexedDB for local analytics storage
- **API**: Cohere API v2 integration
- **Build**: Node.js with sharp for icon generation

### Project Structure
```
SocialBooster/
├── icons/                 # Extension icons and logo
├── scripts/              # Build and utility scripts
├── background.js         # Service worker for background tasks
├── content.js           # Content script for page interaction
├── content.css          # Styles for content script
├── popup.html           # Extension popup interface
├── popup.css            # Popup styling
├── popup.js             # Popup functionality
├── dashboard.html       # Analytics dashboard
├── dashboard.css        # Dashboard styling
├── dashboard.js         # Dashboard functionality
├── db.js               # IndexedDB database management
├── translations.js     # Multi-language support
├── manifest.json       # Extension manifest
└── README.md           # This file
```

### Building
```bash
# Install dependencies
npm install

# Generate icons from SVG
npm run build-icons

# Run build process
npm run build
```

## 🐛 Troubleshooting

### Common Issues

**API Key Not Working**
- Ensure you have a valid Cohere API key
- Check that the key has sufficient credits/quota
- Verify internet connection for API calls

**Automation Not Starting**
- Click "Save Automation Settings" button after configuration
- Check that you're on a supported platform (LinkedIn/Facebook)
- Verify content script is loaded (refresh page if needed)

**Dashboard Not Loading**
- Ensure popup works correctly first
- Check browser console for JavaScript errors
- Try refreshing the dashboard page

**Language Switching Issues**
- Clear browser cache and reload extension
- Check that translations.js is loaded properly
- Try switching languages from both popup and dashboard

## 📈 Performance

### Optimization Features
- Efficient DOM querying with caching
- Debounced API calls to prevent rate limiting
- Lazy loading of dashboard components
- Memory management for long-running sessions

### Resource Usage
- Minimal CPU impact with optimized intervals
- IndexedDB for efficient local storage
- Compressed assets and minified code
- Smart caching of API responses

## 🔄 Updates & Roadmap

### Version 3.0 Features
- ✅ Multi-language support (Hebrew/English)
- ✅ Advanced analytics dashboard
- ✅ Persona management system
- ✅ Cohere API v2 integration
- ✅ Real-time activity monitoring

### Upcoming Features
- 🔄 Instagram support
- 🔄 Twitter/X integration
- 🔄 Advanced AI training
- 🔄 Team collaboration features
- 🔄 Cloud sync capabilities

## 👨‍💻 Creator

**Yuval Avidani**
- 🔗 [Linktr.ee](https://linktr.ee/yuvai)
- 💼 [LinkedIn](https://www.linkedin.com/in/🎗️yuval-avidani-87081474/)
- 🐦 [Twitter @yuvalav](https://twitter.com/yuvalav)
- 📸 [Instagram @yuval_770](https://instagram.com/yuval_770)

## 📄 License

This project is proprietary software created by Yuval Avidani. All rights reserved.

## 🤝 Support

For support, feature requests, or bug reports:
1. Check the troubleshooting section above
2. Contact via social media links
3. Submit detailed issue descriptions with:
   - Browser version
   - Extension version
   - Steps to reproduce
   - Console error messages (if any)

---

**FLY HIGH WITH YUV.AI** 🚀

*Empowering social media engagement through intelligent automation* 