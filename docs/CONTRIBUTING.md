# Contributing to PrintShop OS

Thank you for your interest in contributing to PrintShop OS! This document provides guidelines and standards for contributing to this mission-critical business operating system.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Branch Naming Conventions](#branch-naming-conventions)
- [Commit Message Standards](#commit-message-standards)
- [Pull Request Process](#pull-request-process)
- [Code Review Guidelines](#code-review-guidelines)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Documentation Requirements](#documentation-requirements)
- [Security Considerations](#security-considerations)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of experience level, gender identity, sexual orientation, disability, personal appearance, race, ethnicity, age, religion, or nationality.

### Expected Behavior

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate in a professional setting

## Getting Started

### Prerequisites

Before contributing, ensure you have:

1. **Required Software:**
   - Git (2.x+)
   - Docker and Docker Compose
   - Node.js 18+ (for Strapi development)
   - A code editor (VS Code recommended)

2. **Account Setup:**
   - GitHub account
   - Fork of the PrintShop OS repository

3. **Knowledge Requirements:**
   - Basic understanding of Git workflows
   - Familiarity with JavaScript/Node.js
   - Understanding of REST APIs
   - Docker basics

### Setting Up Development Environment

```bash
# 1. Fork the repository on GitHub
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/printshop-os.git
cd printshop-os

# 3. Add upstream remote
git remote add upstream https://github.com/hypnotizedent/printshop-os.git

# 4. Copy environment template
cp .env.example .env

# 5. Edit .env with development values
nano .env

# 6. Start development environment
docker-compose up -d

# 7. Verify all services are running
docker-compose ps
```

## Development Workflow

### 1. Create a Feature Branch

```bash
# Update your local main branch
git checkout main
git pull upstream main

# Create a feature branch
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

- Write clean, maintainable code
- Follow coding standards (see below)
- Add tests for new functionality
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run linters
npm run lint

# Run tests
npm test

# Test in Docker environment
docker-compose up -d
# Manually test the changes
```

### 4. Commit Your Changes

```bash
# Stage your changes
git add .

# Commit with descriptive message
git commit -m "feat: add customer search functionality"
```

### 5. Push and Create Pull Request

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create pull request on GitHub
# Use the pull request template
```

## Branch Naming Conventions

Use descriptive branch names that indicate the type and purpose of changes:

### Branch Types

- **feature/** - New features or enhancements
  ```
  feature/customer-search
  feature/email-notifications
  ```

- **fix/** - Bug fixes
  ```
  fix/job-status-update
  fix/time-clock-timezone
  ```

- **docs/** - Documentation changes
  ```
  docs/api-reference
  docs/deployment-guide
  ```

- **refactor/** - Code refactoring
  ```
  refactor/job-service
  refactor/api-middleware
  ```

- **test/** - Test additions or modifications
  ```
  test/job-creation
  test/customer-validation
  ```

- **chore/** - Maintenance tasks
  ```
  chore/update-dependencies
  chore/cleanup-logs
  ```

### Branch Naming Rules

1. Use lowercase letters
2. Use hyphens to separate words
3. Keep names concise but descriptive
4. Include issue number if applicable: `feature/123-customer-search`

## Commit Message Standards

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, missing semicolons, etc.)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Maintenance tasks
- **ci**: CI/CD changes

### Examples

```
feat(strapi): add customer search endpoint

Implement a new API endpoint for searching customers by name or email.
Includes pagination and filtering support.

Closes #123
```

```
fix(appsmith): correct time clock timestamp handling

Fix timezone conversion issue causing incorrect clock-in times.
Now properly converts to UTC before storing.

Fixes #456
```

```
docs(api): update Strapi endpoints reference

Add examples for new customer search endpoint.
Update authentication section with token refresh flow.
```

### Commit Message Rules

1. **Subject line:**
   - Max 72 characters
   - Start with lowercase
   - No period at the end
   - Use imperative mood ("add" not "added" or "adds")

2. **Body (optional):**
   - Wrap at 72 characters
   - Explain *what* and *why*, not *how*
   - Separate from subject with blank line

3. **Footer (optional):**
   - Reference issues: `Closes #123`, `Fixes #456`, `Relates to #789`
   - Note breaking changes: `BREAKING CHANGE: describe the change`

## Pull Request Process

### Before Submitting

- [ ] Code follows project coding standards
- [ ] All tests pass
- [ ] New tests added for new functionality
- [ ] Documentation updated
- [ ] Commit messages follow conventions
- [ ] Branch is up to date with main
- [ ] No merge conflicts

### PR Template

When creating a pull request, fill out the provided template completely:

1. **Description**: Clear explanation of changes
2. **Related Issues**: Link to relevant issues
3. **Type of Change**: Check appropriate boxes
4. **Testing**: Describe testing performed
5. **Documentation**: Confirm docs are updated
6. **Screenshots**: Add for UI changes

### PR Title Format

Use the same format as commit messages:

```
feat(component): brief description of changes
```

### PR Size Guidelines

Keep pull requests focused and manageable:

- **Small**: < 100 lines changed (ideal)
- **Medium**: 100-500 lines changed
- **Large**: > 500 lines changed (should be split if possible)

Large PRs may take longer to review and should be avoided when possible.

## Code Review Guidelines

### For Contributors

When your PR is under review:

1. **Respond promptly** to review comments
2. **Be open** to feedback and suggestions
3. **Ask questions** if feedback is unclear
4. **Update your PR** based on feedback
5. **Mark conversations** as resolved when addressed

### For Reviewers

When reviewing a PR:

1. **Review promptly** (within 48 hours if possible)
2. **Be constructive** and respectful
3. **Explain reasoning** behind suggestions
4. **Approve** when ready or **request changes** with clear guidance
5. **Test the changes** when possible

### Review Checklist

- [ ] Code is clean and maintainable
- [ ] Logic is sound and efficient
- [ ] Error handling is appropriate
- [ ] Security best practices followed
- [ ] Tests are adequate
- [ ] Documentation is clear
- [ ] No obvious bugs

## Coding Standards

### JavaScript/Node.js

**Style Guide**: Follow [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)

**Key Points:**

```javascript
// Use const for variables that don't change
const API_URL = 'http://localhost:1337';

// Use let for variables that change
let jobStatus = 'Pending';

// Use descriptive variable names
const customerEmail = 'customer@example.com'; // Good
const ce = 'customer@example.com'; // Bad

// Use arrow functions for anonymous functions
const fetchJobs = async () => {
  const response = await fetch('/api/jobs');
  return response.json();
};

// Use async/await instead of promises
// Good:
async function getCustomer(id) {
  try {
    const customer = await strapi.entityService.findOne('api::customer.customer', id);
    return customer;
  } catch (error) {
    console.error('Error fetching customer:', error);
    throw error;
  }
}

// Bad:
function getCustomer(id) {
  return strapi.entityService.findOne('api::customer.customer', id)
    .then(customer => customer)
    .catch(error => {
      console.error('Error fetching customer:', error);
      throw error;
    });
}

// Use destructuring
const { name, email } = customer; // Good
const name = customer.name; // Less ideal
const email = customer.email;

// Use template literals
const message = `Hello ${customer.name}`; // Good
const message = 'Hello ' + customer.name; // Bad
```

### Documentation Comments

```javascript
/**
 * Fetches a customer by ID
 * @param {number} id - Customer ID
 * @returns {Promise<Object>} Customer object
 * @throws {Error} If customer not found
 */
async function getCustomer(id) {
  // Implementation
}
```

### Error Handling

```javascript
// Always handle errors appropriately
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  // Log the error
  console.error('Operation failed:', error);
  
  // Return user-friendly error
  throw new Error('Unable to complete operation. Please try again.');
}
```

### Environment Variables

```javascript
// Never hardcode sensitive values
const API_TOKEN = process.env.STRAPI_API_TOKEN; // Good
const API_TOKEN = 'abc123token'; // Bad - security risk!

// Provide defaults for non-sensitive values
const PORT = process.env.PORT || 1337;
```

## Testing Requirements

### Test Coverage

- **New Features**: Must include tests
- **Bug Fixes**: Must include regression tests
- **Minimum Coverage**: 70% for new code

### Testing Frameworks

- **Strapi**: Jest
- **Appsmith**: Manual testing (no automated tests initially)
- **Botpress**: Flow testing in Botpress Emulator

### Writing Tests

```javascript
// Example: Strapi controller test
describe('Job Controller', () => {
  test('should create a new job', async () => {
    const jobData = {
      Status: 'Pending Artwork',
      Quantity: 100,
      customer: 1
    };
    
    const job = await strapi.entityService.create('api::job.job', {
      data: jobData
    });
    
    expect(job).toBeDefined();
    expect(job.Status).toBe('Pending Artwork');
    expect(job.Quantity).toBe(100);
  });
  
  test('should reject invalid quantity', async () => {
    const jobData = {
      Status: 'Pending Artwork',
      Quantity: -5, // Invalid
      customer: 1
    };
    
    await expect(
      strapi.entityService.create('api::job.job', { data: jobData })
    ).rejects.toThrow();
  });
});
```

## Documentation Requirements

### When to Update Documentation

Update documentation when you:

1. Add new features
2. Change existing functionality
3. Add new API endpoints
4. Modify configuration options
5. Change deployment procedures
6. Fix bugs that affect documented behavior

### Documentation Standards

- **Clear and concise**: Avoid jargon, explain technical terms
- **Step-by-step**: Provide explicit instructions
- **Examples**: Include code examples and screenshots
- **Up-to-date**: Keep in sync with code changes
- **AI-friendly**: Write as if training an AI agent

### Documentation Locations

- **API changes**: Update `/docs/api/`
- **Architecture changes**: Update `/docs/architecture/`
- **Deployment changes**: Update `/docs/deployment/`
- **Phase guides**: Update `/docs/phases/`
- **README**: Update if it affects quick start or overview

## Security Considerations

### Security Checklist

- [ ] No secrets committed to repository
- [ ] Input validation for all user data
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] Authentication/authorization properly implemented
- [ ] Sensitive data encrypted at rest and in transit
- [ ] Rate limiting for API endpoints
- [ ] Error messages don't leak sensitive information

### Reporting Security Vulnerabilities

**Do not** report security vulnerabilities through public GitHub issues.

Instead, follow the process in [SECURITY.md](../SECURITY.md):

1. Email maintainers privately
2. Provide detailed description
3. Allow time for fix before disclosure

## How to Document New Features

When adding a new feature:

### 1. Code Comments

```javascript
/**
 * Feature: Customer Search
 * 
 * Allows searching customers by name or email with pagination support.
 * 
 * @route GET /api/customers/search
 * @param {string} query - Search term
 * @param {number} page - Page number (default: 1)
 * @param {number} pageSize - Results per page (default: 25)
 * @returns {Array<Customer>} Matching customers
 */
```

### 2. API Documentation

Update `/docs/api/strapi-endpoints.md`:

```markdown
### Search Customers

**Endpoint:** `GET /api/customers/search`

**Description:** Search for customers by name or email

**Parameters:**
- `query` (string, required): Search term
- `page` (number, optional): Page number (default: 1)
- `pageSize` (number, optional): Results per page (default: 25)

**Example Request:**
\`\`\`http
GET /api/customers/search?query=john&page=1&pageSize=10
Authorization: Bearer {token}
\`\`\`

**Example Response:**
\`\`\`json
{
  "data": [...],
  "meta": { "pagination": {...} }
}
\`\`\`
```

### 3. Update CHANGELOG.md

```markdown
### Added
- Customer search endpoint with pagination support (#123)
```

### 4. Update README (if significant)

Add to relevant section if it's a major feature.

## Getting Help

### Resources

- **Documentation**: Check `/docs` folder first
- **Issues**: Search existing issues for similar problems
- **Discussions**: Use GitHub Discussions for questions

### Asking Questions

When asking for help:

1. **Search first**: Check if question already answered
2. **Be specific**: Provide context and details
3. **Include examples**: Code samples, error messages, screenshots
4. **Show effort**: Describe what you've already tried

### Contact

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Email**: For security vulnerabilities only (see SECURITY.md)

## Recognition

Contributors will be:

- Listed in release notes
- Credited in CHANGELOG.md
- Recognized in project README (for significant contributions)

## License

By contributing to PrintShop OS, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to PrintShop OS! Your efforts help build a better system for print shop operations.
