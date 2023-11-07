# Garden of Gaia Development Setup

This guide will help you set up the Garden of Gaia app for development. Follow these step-by-step instructions, and you'll have everything you need to start contributing.

## Prerequisites

Before you start, you'll need to have Git and Node.js installed on your computer. These tools are essential for working with the code and managing dependencies.

- **Git**: [Download & Install Git](https://git-scm.com/downloads). Ensure you select the option to add Git to your system PATH.
- **Node.js and npm**: [Download & Install Node.js](https://nodejs.org/en/download/). npm is included with Node.js.

## Checking the Installation

Open a terminal and run these commands to check that Git and Node.js are installed:

```bash
git --version
node --version
npm --version
```

You should see version numbers for each command. If not, check that you've installed them correctly and that they're added to your PATH.

## Setting Up the IDE

Visual Studio Code (VSCode) is a powerful and user-friendly IDE for web development.

- Download and install VSCode from the [VSCode Download Page](https://code.visualstudio.com/Download).

## Cloning the Repository

Use Git to clone the repository to your local machine.

1. Open VSCode.
2. Access the integrated terminal (`Terminal > New Terminal` from the top menu).
3. Enter the following command to clone the repo:

```bash
git clone https://github.com/yourusername/plant-detective.git
```

4. To open the project in VSCode, navigate to the directory and open it:

```bash
cd plant-detective
code .
```

## Installing Project Dependencies

The project has dependencies that need to be installed using npm. In the terminal, run:

```bash
npm install
```

This command downloads all the necessary libraries and tools required by the app.

## Running the App

To run the app in development mode, execute:

```bash
npm start
```

This command starts a development server and opens the app in your default web browser. If it doesn't open automatically, go to [http://localhost:3000](http://localhost:3000).

If you need to stop the server, you can press `Ctrl + C` in the terminal where the server is running.

## Making and Committing Changes

Here's how to make changes and commit them to the project:

1. Find a task in the `TODO.txt` file.
2. Make your changes in VSCode.
3. Test your changes by saving files and checking the result in the web browser.

When ready to commit:

1. Go to the Source Control panel in VSCode (branch icon on the sidebar).
2. Stage your changes by clicking the '+' next to modified files.
3. Type a commit message that describes your changes.
4. Commit the changes with `Ctrl + Enter` or by clicking the checkmark icon.

In the terminal, push your changes with:

```bash
git push origin main
```

This command sends your commits to the GitHub repository.

## Submitting a Pull Request

After pushing your changes:

1. Go to the repository on GitHub.
2. Click "Pull requests" > "New pull request".
3. Compare the original repository (base) with your fork (compare).
4. Click "Create pull request", fill in the details, and submit.

## Handling Issues

Encounter a problem? Here's what to do:

1. Note any error messages.
2. Search online for the error message; someone may have already solved it!
3. Ask for help on developer forums, or reach out to a more experienced developer.
4. You can also describe your issue to [ChatGPT](https://openai.com/chatgpt) with error messages and code snippets, using triple backticks for formatting.

## Additional Resources

- Git: [Git Documentation](https://git-scm.com/doc)
- Node.js and npm: [npm Docs](https://docs.npmjs.com/)
- React: [React Official Tutorial](https://reactjs.org/tutorial/tutorial.html)

Happy coding!