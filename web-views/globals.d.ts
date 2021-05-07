export declare global {
	const tsVscode: {
		postMessage: (msg: { type: string; value: string }) => void;
		setState: (state: any) => void;
		getState: () => undefined | any;
	};
}
