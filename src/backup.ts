import fs from "node:fs";
import path from "node:path";

import { resolveBackupDir, resolveKarabinerConfigPath } from "./cli/paths.js";

interface BackupOptions {
    karabinerConfigPath?: string;
    backupDir?: string;
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

export interface BackupResult {
    backupPath: string;
    backupFilePath: string;
    metadataPath: string;
    metadata: BackupMetadata;
}

export function backup(options: BackupOptions = {}): BackupResult {
    const activePath = resolveKarabinerConfigPath(options.karabinerConfigPath);
    const backupDir = resolveBackupDir(options.backupDir);
    const backupPath = path.join(backupDir, createTimestamp());
    const backupFilePath = path.join(backupPath, "karabiner.json");
    const metadataPath = path.join(backupPath, "metadata.json");

    if (!pathExists(activePath)) {
        throw new Error(`Karabiner config not found: ${activePath}`);
    }

    fs.mkdirSync(backupPath, { recursive: true });

    const metadata = createBackup(activePath, backupFilePath);

    fs.writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);

    return {
        backupPath,
        backupFilePath,
        metadataPath,
        metadata,
    };
}

function createBackup(
    activePath: string,
    backupFilePath: string,
): BackupMetadata {
    const stats = fs.lstatSync(activePath);
    const createdAt = new Date().toISOString();

    if (stats.isSymbolicLink()) {
        const targetPath = resolveSymlinkTarget(activePath);
        const targetStats = fs.statSync(targetPath);

        if (!targetStats.isFile()) {
            throw new Error(
                `Karabiner config symlink target is not a file: ${targetPath}`,
            );
        }

        fs.copyFileSync(targetPath, backupFilePath);

        return {
            version: 1,
            kind: "symlink",
            activePath,
            targetPath,
            createdAt,
        };
    }

    if (!stats.isFile()) {
        throw new Error(
            `Karabiner config is not a regular file: ${activePath}`,
        );
    }

    fs.copyFileSync(activePath, backupFilePath);

    return {
        version: 1,
        kind: "file",
        activePath,
        createdAt,
    };
}

function resolveSymlinkTarget(activePath: string): string {
    const targetPath = fs.readlinkSync(activePath);

    if (path.isAbsolute(targetPath)) {
        return targetPath;
    }

    return path.resolve(path.dirname(activePath), targetPath);
}

function pathExists(filePath: string): boolean {
    return fs.existsSync(filePath);
}

function createTimestamp(): string {
    const now = new Date();

    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1);
    const day = pad(now.getDate());
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());

    return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

function pad(value: number): string {
    return String(value).padStart(2, "0");
}
