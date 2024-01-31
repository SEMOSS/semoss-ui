/**
 * Ignore the result of a promise
 * @param executor - function that returns a promise
 * @returns
 */
export const cancellablePromise = <R>(
    executor: () => Promise<R>,
): {
    promise: Promise<R>;
    cancel: () => void;
} => {
    // track if it is cancelled or not
    let cancelled = false;

    // track a timeout to delay execution
    let timeout: ReturnType<typeof setTimeout> | null = null;

    return {
        promise: new Promise<R>((resolve, reject) => {
            console.log('starting timeout');
            // wrap in a timeout to execute after the current thread is done
            if (!cancelled) {
                timeout = setTimeout(async () => {
                    try {
                        const response = await executor();

                        console.log(`cancelled: ` + cancelled);
                        // ignore if cancelled
                        if (cancelled) {
                            return;
                        }

                        return resolve(response);
                    } catch (err) {
                        return reject(err);
                    }
                }, 0);
            }
        }),
        cancel: () => {
            console.log('in cancel');
            // clear the timeout if it's there
            if (timeout) {
                console.log('clearing timeout');
                clearTimeout(timeout);
            }

            // mark as cancelled
            cancelled = true;
        },
    };
};
