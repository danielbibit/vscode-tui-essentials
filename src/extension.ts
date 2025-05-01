import * as vscode from 'vscode';
import { runRangerCommand } from './ranger';

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

    context.subscriptions.push(runTaskCommand);
    context.subscriptions.push(runRangerCommand);
}
