import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  const runTaskCommand = vscode.commands.registerCommand('tui-essentials.runTaskAndClosePanel', async (args) => {
    const taskName = args;
    if (!taskName) {
      vscode.window.showErrorMessage("No task name provided.");
      return;
    }

    const tasks = await vscode.tasks.fetchTasks();
    const targetTask = tasks.find(task => task.name === taskName);

    if (!targetTask) {
      vscode.window.showErrorMessage(`Task "${taskName}" not found.`);
      return;
    }

    vscode.tasks.executeTask(targetTask);

    const taskEndListener = vscode.tasks.onDidEndTaskProcess(e => {
      if (e.execution.task.name === taskName) {
        vscode.commands.executeCommand('workbench.action.closePanel');
        taskEndListener.dispose();
      }
    });
  });

  const runRangerCommand = vscode.commands.registerCommand('tui-essentials.launchRanger', async () => {
    //when termianl loses focus, close the panel
    const terminalFocusListener = vscode.window.onDidChangeActiveTextEditor((e) => {
      // act only on ranger terminal
      const activeTerminal = vscode.window.activeTerminal;
      if (activeTerminal && activeTerminal.name !== "Ranger") {
        return;
      }

      //close ranger terminal
      const terminals = vscode.window.terminals;
      const rangerTerminal = terminals.find(t => t.name === "Ranger");
      if (rangerTerminal) {
        rangerTerminal.dispose();
      }

      vscode.commands.executeCommand('workbench.action.closePanel');

      terminalFocusListener.dispose();
    });

    // listen for terminal manual close
    const terminalCloseListener = vscode.window.onDidCloseTerminal((terminal) => {
      if (terminal.name === "Ranger") {
        vscode.commands.executeCommand('workbench.action.closePanel');
        terminalCloseListener.dispose();
      }
    });

    // Verify if no ranger terminal is already open
    const terminals = vscode.window.terminals;
    const rangerTerminal = terminals.find(t => t.name === "Ranger");
    if (rangerTerminal) {
      rangerTerminal.show();
      return;
    }

    // Launch ranger in a editor on the current directory
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      // If no editor is open, open ranger in the workspace root
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage("No workspace folder found.");
        return;
      }

      const workspaceRoot = workspaceFolders[0].uri.fsPath;
      const terminal = vscode.window.createTerminal({ name: "Ranger" });
      terminal.sendText(`ranger ${workspaceRoot} && exit`);
      terminal.show();
      return;
    }

    const filePath = editor.document.uri.fsPath;
    const fileDir = filePath.substring(0, filePath.lastIndexOf('/'));
    const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
    const terminal = vscode.window.createTerminal({ name: "Ranger" });
    terminal.sendText(`cd ${fileDir} && ranger --selectfile=${fileName} --cmd='set preview_files=true' --cmd='set line_numbers=relative' && exit`);
    terminal.show();
  });

  context.subscriptions.push(runTaskCommand);
  context.subscriptions.push(runRangerCommand);
}
