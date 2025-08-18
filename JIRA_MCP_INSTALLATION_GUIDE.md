# Jira MCP Service Installation and Usage Guide

## Overview

This guide will help you install and configure the Jira Model Context Protocol (MCP) service for use with Claude Desktop and GitHub Copilot in VS Code. The MCP service allows AI assistants to interact with your Jira instance to retrieve project information, issues, and other data.

## Prerequisites

Before starting, ensure you have:
- A Mac computer (Intel or M1/M2 chip supported)
- macOS 10.15 or higher
- Administrator privileges on your computer
- Access to your company's Jira instance
- **Company VPN connection** (if you experience network issues during installation)

## Part 1: Environment Setup

### Step 1: Install Homebrew, Docker and Colima

We'll install all required components in a streamlined process.

#### 1.1 Open Terminal

- Press `Command + Space` to open Spotlight search
- Type "Terminal"
- Press Enter to open Terminal

#### 1.2 One-Line Installation Command

Copy and paste the following command in Terminal, then press Enter:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" && brew install colima docker
```

This command will:
1. Install Homebrew (package manager for Mac)
2. Install Colima (lightweight container runtime)
3. Install Docker (containerization platform)

**Important Notes:**
- You'll be prompted to enter your computer password (the same one you use to log into your Mac)
- When typing the password, no characters will appear on screen - this is normal
- Installation may take several minutes, please be patient
- **If you encounter network issues, please connect to the company VPN first**

**References:** 
- Homebrew: https://brew.sh/
- Docker with Colima setup: https://piaohua.github.io/post/docker/20231028-mac-colima/

#### 1.3 Verify Installation

After installation completes, verify everything worked by running:

```bash
brew --version && docker --version && colima --version
```

If you see version numbers for all three tools, the installation was successful.

### Step 2: Start Docker Environment

#### 2.1 Basic Startup

Start the Docker environment with:

```bash
colima start
```

**First-time startup notes:**
- The first startup requires downloading VM images, which may take several minutes
- You'll see "done" when startup is successful
- **If download is slow, ensure you're connected to the company VPN**

#### 2.2 Verify Docker is Working

```bash
docker ps
```

If you see output similar to this (possibly empty), Docker is running correctly:
```
CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES
```



## Part 2: Configuration

### Get Jira Access Token

Get jira access token from this link:

### Pull Image

```bash
docker pull sooperset/mcp-atlassian:latest
```

**Note:** If you encounter network issues during the pull, please ensure you're connected to the company VPN.



### For Claude Code User

```
claude code mcp add atlassian -s user .....
```

### For VS Code GitHub Copilot User

**Step-by-Step Instructions:**

1. **Quick Open Settings JSON**:
   - Press `Cmd+Shift+P` to open Command Palette
   - Type `Preferences: Open User Settings (JSON)`
   - Press Enter

2. **Locate or Add MCP Configuration**:
   - Use `Cmd+F` to search for "mcp" in the file
   - If no MCP configuration exists, add the following block to your settings.json

3. **Add the Configuration**:
   ```json
   {
     "mcp.servers": {
       "atlassian": {
         "command": "docker",
         "args": [
           "run",
           "--rm",
           "-e", "JIRA_URL=https://your-company.atlassian.net",
           "-e", "JIRA_USERNAME=your-email@company.com", 
           "-e", "JIRA_API_TOKEN=your-api-token",
           "sooperset/mcp-atlassian:latest"
         ]
       }
     }
   }
   ```

4. **Replace Placeholder Values**:
   - Replace `https://your-company.atlassian.net` with your actual Jira URL
   - Replace `your-email@company.com` with your Jira email
   - Replace `your-api-token` with your actual Jira API token

5. **Save the File**: Press `Cmd+S` to save the configuration json

## Part 3: Testing and Usage

### Step 3.1: Verify MCP Service in Claude Desktop

#### 3.1.1 Check Connection Status

1. Open Claude Desktop
2. In a new conversation, type:
   ```
   Can you check if the Jira MCP service is connected?
   ```

#### 3.1.2 Test Basic Functionality

Try these test commands in Claude:

```
1. "List my recent Jira issues"
2. "Show me projects in Jira"
3. "Find issues assigned to me"
4. "Get details for issue KEY-123" (replace with actual issue key)
```

**Expected Results:**
- Claude should be able to fetch and display Jira data
- If there are errors, check your configuration and network connection

### Step 3.2: Verify MCP Service in VS Code with GitHub Copilot

#### 3.2.1 Check Service Status

1. Open VS Code
2. Open the Command Palette (Cmd+Shift+P)
3. Type "MCP: Show Status" or similar command
4. Check if the Jira service shows as "Connected"

#### 3.2.2 Test Functionality

1. Create a new file or open an existing project
2. In a comment or code, try typing:
   ```javascript
   // TODO: Check Jira issue PROJ-123 for requirements
   ```

3. Use GitHub Copilot to ask:
   ```
   // Can you help me understand the requirements from Jira issue PROJ-123?
   ```

**Expected Results:**
- Copilot should be able to access Jira data through the MCP service
- You should see relevant issue information in suggestions

## Daily Usage Tips

### Starting the Environment

Every time you restart your computer, you'll need to start Docker:

```bash
colima start
```

### Stopping the Environment

When not using Docker, save system resources by stopping it:

```bash
colima stop
```

### Checking Service Status

To check if the MCP service is running:

```bash
docker ps
```

Look for containers with the `sooperset/mcp-atlassian` image.

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: "Command not found: brew"
**Solution:** Reinstall Homebrew or restart Terminal.

#### Issue 2: "Cannot connect to Docker daemon"
**Solution:** Run `colima start` to start the Docker environment.

#### Issue 3: Network connection issues during installation
**Solution:** 
1. Connect to the company VPN
2. Try the installation commands again
3. If still failing, contact IT support

#### Issue 4: Jira authentication fails
**Solution:**
1. Verify your Jira URL is correct
2. Check that your API token is valid
3. Ensure your username/email is correct
4. Try generating a new API token

#### Issue 5: MCP service not connecting in Claude/VS Code
**Solution:**
1. Restart Docker: `colima stop && colima start`
2. Restart the application (Claude Desktop or VS Code)
3. Check the configuration file for syntax errors
4. Verify Docker container can run manually:
   ```bash
   docker run --rm -e JIRA_URL=your-url -e JIRA_USERNAME=your-email -e JIRA_API_TOKEN=your-token sooperset/mcp-atlassian:latest --help
   ```

#### Issue 6: Slow performance
**Solution:**
1. Allocate more resources to Colima:
   ```bash
   colima stop
   colima start --cpu 2 --memory 4
   ```
2. Ensure good network connection to company VPN

### Getting Help

If you encounter issues not covered in this guide:

1. Check the error messages carefully
2. Ensure all prerequisites are met
3. Verify network connectivity and VPN connection
4. Contact the technical team with:
   - The specific error message
   - Steps you've already tried
   - Your system configuration (Mac model, macOS version)

## Security Considerations

1. **API Token Security:** 
   - Never share your Jira API token
   - Store it securely in the configuration file
   - Regenerate it periodically

2. **VPN Usage:**
   - Always use company VPN when accessing Jira
   - Ensure VPN is active during MCP service usage

3. **Configuration File Protection:**
   - Ensure configuration files have appropriate permissions
   - Don't commit API tokens to version control

## Conclusion

You have successfully installed and configured the Jira MCP service for use with Claude Desktop and GitHub Copilot in VS Code. This setup allows these AI assistants to access your Jira data and provide more contextual help with your projects.

**Key Points to Remember:**
- Start Docker with `colima start` after computer restart
- Use company VPN for network-related operations
- Keep your API tokens secure and up to date
- Contact technical support if you encounter persistent issues

**Useful Commands Quick Reference:**
```bash
# Start Docker environment
colima start

# Stop Docker environment  
colima stop

# Check Docker status
docker ps

# Test MCP service manually
docker run --rm sooperset/mcp-atlassian:latest --help

# Check Homebrew version
brew --version
```

Happy coding with enhanced AI assistance!
