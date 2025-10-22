# Contributing to KeyVault Pro

Thank you for your interest in contributing to KeyVault Pro! This document provides guidelines and instructions for contributing.

## Code of Conduct

Be respectful, inclusive, and constructive in all interactions.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in Issues
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser/OS version
   - Screenshots if applicable

### Suggesting Features

1. Check if the feature has been suggested
2. Create a new issue with:
   - Clear use case
   - Expected behavior
   - Why it would be useful
   - Possible implementation ideas

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit with clear messages (`git commit -m 'Add amazing feature'`)
6. Push to your fork (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Development Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/keyvault-pro.git
cd keyvault-pro

# Install CLI dependencies (if working on CLI)
cd cli
npm install

# Install MCP server dependencies (if working on MCP)
cd mcp-server
npm install
```

## Project Structure

```
keyvault-pro/
├── background/          # Extension background scripts
├── content/            # Content scripts for page interaction
├── popup/              # Extension popup UI
├── options/            # Settings page
├── lib/                # Shared libraries
├── cli/                # Command-line tool
├── mcp-server/         # MCP server for AI integration
└── assets/             # Icons and static files
```

## Coding Standards

### JavaScript

- Use ES6+ features
- Use meaningful variable names
- Add JSDoc comments for functions
- Follow existing code style
- No external dependencies in extension code (keep it lightweight)

### Security

- Never log sensitive data
- Always encrypt keys before storage
- Use constant-time comparisons for passwords
- Validate all user inputs
- Follow OWASP security guidelines

### Testing

- Test on multiple browsers (Chrome, Edge, Brave)
- Test all user flows
- Test error handling
- Test with various key formats

## Areas for Contribution

### High Priority

- [ ] Firefox Manifest V2 compatibility
- [ ] Automated tests
- [ ] Accessibility improvements
- [ ] Internationalization (i18n)
- [ ] Performance optimizations

### Features

- [ ] Browser sync (encrypted)
- [ ] Team sharing
- [ ] Key rotation automation
- [ ] Breach detection integration
- [ ] Biometric unlock
- [ ] Mobile app

### Documentation

- [ ] Video tutorials
- [ ] More usage examples
- [ ] API documentation
- [ ] Translation to other languages

### UI/UX

- [ ] Keyboard navigation
- [ ] Drag-and-drop organization
- [ ] Bulk operations
- [ ] Custom themes
- [ ] Accessibility enhancements

## Commit Message Guidelines

Use conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Examples:
```
feat: add biometric unlock support
fix: resolve auto-lock timer issue
docs: update installation guide
```

## Review Process

1. All PRs require review
2. Must pass basic testing
3. Must follow coding standards
4. Must include documentation updates if needed
5. Must not introduce security vulnerabilities

## Questions?

- Open an issue for questions
- Check existing documentation
- Review closed issues for similar questions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to KeyVault Pro! 🔑

