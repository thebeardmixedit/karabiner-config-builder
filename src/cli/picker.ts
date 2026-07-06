import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

export interface PickItem<T> {
    label: string;
    detail?: string;
    value: T;
}

export interface PickOptions<T> {
    title: string;
    items: PickItem<T>[];
    prompt?: string;
    emptyMessage?: string;
}

export async function pickOne<T>(options: PickOptions<T>): Promise<T> {
    if (options.items.length === 0) {
        throw new Error(options.emptyMessage ?? "No items available.");
    }

    console.log(options.title);
    console.log("");

    options.items.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.label}`);

        if (item.detail) {
            console.log(`     ${item.detail}`);
        }
    });

    console.log("");

    const rl = readline.createInterface({ input, output });

    try {
        const answer = await rl.question(
            options.prompt ?? `Choose an item [1-${options.items.length}]: `,
        );

        const selectedIndex = Number(answer) - 1;

        if (
            !Number.isInteger(selectedIndex) ||
            selectedIndex < 0 ||
            selectedIndex >= options.items.length
        ) {
            throw new Error("No valid item selected.");
        }

        const selectedItem = options.items[selectedIndex];

        if (!selectedItem) {
            throw new Error("No valid item selected.");
        }

        return selectedItem.value;
    } finally {
        rl.close();
    }
}
