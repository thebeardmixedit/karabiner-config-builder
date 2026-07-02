import fs from "node:fs";
import path from "node:path";

import {
    resolveBackupDir,
    resolveKarabinerConfigPath,
    resolvePath,
} from "./cli/paths";

interface RestoreOptions {
    backupPath?: string;
    backupDir?: string;
    karabinerConfigPath?: string;
}

interface FileBackupMetadata {
    version: 1;
    kind: "file";
    activePath: string;
    createdAt: string;
}

interface SymlinkBackupMetadata {
    version: 1;
    kind: "symlink";
    activePath: string;
    targetPath: string;
    createdAt: string;
}

type BackupMetadata = FileBackupMetadata | SymlinkBackupMetadata;

export interface RestoreResult {
    backupPath: string;
    backupFilePath: string;
    metadataPath: string;
    metadata: BackupMetadata;
    restoredPath: string;
    restoredTargetPath?: string;
    restoredTargetContents: boolean;
}

export function restore(options: RestoreOptions = {}): RestoreResult {
    const backupDir = resolveBackupDir(options.backupDir);
    const backupPath = resolveBackupPath(options.backupPath, backupDir);
    const metadataPath = path.join(backupPath, "metadata.json");
    const backupFilePath = path.join(backupPath, "karabiner.json");

    if (!fs.existsSync(metadataPath)) {
        throw new Error(`Backup metadata not found: ${metadataPath}`);
    }

    if (!fs.existsSync(backupFilePath)) {
        throw new Error(`Backup config not found: ${backupFilePath}`);
    }

    const metadata = readBackupMetadata(metadataPath);
    const activePath = resolveKarabinerConfigPath(
        options.karabinerConfigPath ?? metadata.activePath,
    );

    if (metadata.kind === "file") {
        restoreFileBackup(backupFilePath, activePath);

        return {
            backupPath,
            backupFilePath,
            metadataPath,
            metadata,
            restoredPath: activePath,
            restoredTargetContents: true,
        };
    }

    const targetPath = resolvePath(metadata.targetPath);
    const restoredTargetContents = restoreSymlinkBackup(
        backupFilePath,
        activePath,
        targetPath,
    );

    return {
        backupPath,
        backupFilePath,
        metadataPath,
        metadata,
        restoredPath: activePath,
        restoredTargetPath: targetPath,
        restoredTargetContents,
    };
}

export function findLatestBackup(backupDir?: string): string {
    const resolvedBackupDir = resolveBackupDir(backupDir);

    if (!fs.existsSync(resolvedBackupDir)) {
        throw new Error(`Backup directory not found: ${resolvedBackupDir}`);
    }

    const backupPaths = fs
        .readdirSync(resolvedBackupDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => path.join(resolvedBackupDir, entry.name))
        .sort()
        .reverse();

    const latestBackupPath = backupPaths[0];

    if (!latestBackupPath) {
        throw new Error(`No backups found in: ${resolvedBackupDir}`);
    }

    return latestBackupPath;
}

function resolveBackupPath(
    backupPath: string | undefined,
    backupDir: string,
): string {
    if (backupPath) {
        return resolvePath(backupPath);
    }

    return findLatestBackup(backupDir);
}

function readBackupMetadata(metadataPath: string): BackupMetadata {
    const metadata = JSON.parse(
        fs.readFileSync(metadataPath, "utf8"),
    ) as BackupMetadata;

    validateBackupMetadata(metadata, metadataPath);

    return metadata;
}

function validateBackupMetadata(
    metadata: BackupMetadata,
    metadataPath: string,
): void {
    if (metadata.version !== 1) {
        throw new Error(`Unsupported backup metadata version: ${metadataPath}`);
    }

    if (metadata.kind !== "file" && metadata.kind !== "symlink") {
        throw new Error(`Unsupported backup kind in: ${metadataPath}`);
    }

    if (!metadata.activePath) {
        throw new Error(`Backup metadata missing activePath: ${metadataPath}`);
    }

    if (metadata.kind === "symlink" && !metadata.targetPath) {
        throw new Error(
            `Symlink backup metadata missing targetPath: ${metadataPath}`,
        );
    }
}

function restoreFileBackup(backupFilePath: string, activePath: string): void {
    fs.mkdirSync(path.dirname(activePath), { recursive: true });

    removeExistingPath(activePath);

    fs.copyFileSync(backupFilePath, activePath);
}

function restoreSymlinkBackup(
    backupFilePath: string,
    activePath: string,
    targetPath: string,
): boolean {
    fs.mkdirSync(path.dirname(activePath), { recursive: true });
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });

    removeExistingPath(activePath);

    const shouldRestoreTargetContents = !fs.existsSync(targetPath);

    if (shouldRestoreTargetContents) {
        fs.copyFileSync(backupFilePath, targetPath);
    }

    fs.symlinkSync(targetPath, activePath);

    return shouldRestoreTargetContents;
}

function removeExistingPath(filePath: string): void {
    if (!fs.existsSync(filePath) && !isSymlink(filePath)) {
        return;
    }

    fs.rmSync(filePath, { force: true });
}

function isSymlink(filePath: string): boolean {
    try {
        return fs.lstatSync(filePath).isSymbolicLink();
    } catch {
        return false;
    }
}
