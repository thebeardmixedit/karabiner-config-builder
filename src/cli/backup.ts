import { backup } from "../backup";

const result = backup();

if (result.metadata.kind === "symlink") {
    console.log("Backed up symlinked Karabiner config:");
    console.log(`Active: ${result.metadata.activePath}`);
    console.log(`Target: ${result.metadata.targetPath}`);
    console.log(`Backup: ${result.backupPath}`);
} else {
    console.log("Backed up Karabiner config:");
    console.log(`Active: ${result.metadata.activePath}`);
    console.log(`Backup: ${result.backupPath}`);
}
