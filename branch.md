Creating your changes in a separate branch is the safest way to do this. It keeps your main branch clean and allows you to test everything with Copilot before merging it into your main codebase.

Because you have already signed into VS Code with your new account (for Copilot) and invited it as a collaborator, you can do all of this branch work directly from your terminal.

The Branch Workflow
1. Create and Switch to a New Branch
Before you start writing any new code with Copilot, open your terminal in your project folder and run:

Bash
git checkout -b feature/copilot-coding
(You can replace feature/copilot-coding with whatever name you want for your branch).

The -b flag tells Git to create the branch, and checkout immediately switches you onto it. To verify you are on the right branch, type git branch—the one with the asterisk * next to it is your active branch.

2. Write Your Code with Copilot
Now, go ahead and use Copilot inside VS Code to write your features or fix your dependencies. All the changes you make will be safely contained inside this new branch.

3. Commit and Push the Branch to the Original Repo
Once you are done coding, you need to push this specific branch up to your original repository:

Bash
git add .
git commit -m "Added features using Copilot on a separate branch"
git push -u origin feature/copilot-coding
