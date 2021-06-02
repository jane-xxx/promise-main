class Promise {
    constructor(executor) {
        this.promiseState = 'pending';
        this.promiseResult = null;
        this.callbackList = [];
        const resolve = val => {
            if (this.promiseState !== 'pending') {
                return;
            }
            this.promiseState = 'fulfilled';
            this.promiseResult = val;
            for (let callback of this.callbackList) {
                callback.onResolved(val);
            }
        };
        const reject = err => {
            if (this.promiseState !== 'pending') {
                return;
            }
            this.promiseState = 'rejected';
            this.promiseResult = err;
            for (let callback of this.callbackList) {
                callback.onRejected(err);
            }
        };
        try {
            executor(resolve, reject);
        } catch (err) {
            reject(err);
        }
    }
    then(onResolved, onRejected) {
        let self = this;
        if (typeof onResolved !== 'function') {
            onResolved = val => val;
        }
        if (typeof onRejected !== 'function') {
            onRejected = err => {
                throw err;
            };
        }
        return new Promise((resolve, reject) => {
            const handleCallback = callback => {
                try {
                    let res = callback(self.promiseResult);
                    if (res instanceof Promise) {
                        res.then(val => {
                            resolve(val);
                        }, err => {
                            reject(err);
                        });
                    } else {
                        resolve(res);
                    }
                } catch (err) {
                    reject(err);
                }
            };
            if (this.promiseState === 'fulfilled') {
                handleCallback(onResolved);
            }
            if (this.promiseState === 'rejected') {
                handleCallback(onRejected);
            }
            if (this.promiseState === 'pending') {
                this.callbackList.push({
                    onResolved: () => {
                        handleCallback(onResolved);
                    },
                    onRejected: () => {
                        handleCallback(onRejected);
                    }
                });
            }
        });
    }
    catch(onRejected) {
        return this.then(undefined, onRejected);
    }
    static resolve(res) {
        return new Promise((resolve, reject) => {
            if (res instanceof Promise) {
                res.then(val => {
                    resolve(val);
                }, err => {
                    reject(err);
                });
            } else {
                resolve(res);
            }
        });
    }
    static reject(res) {
        return new Promise((resolve, reject) => {
            reject(res);
        });
    }
    static all(promiseList) {
        let count = 0;
        let res = [];
        let length = promiseList.length;
        return new Promise((resolve, reject) => {
            for (let i = 0; i < length; i++) {
                promiseList[i].then(val => {
                    count++;
                    res[i] = val;
                    if (count === length) {
                        resolve(res);
                    }
                }, err => {
                    reject(err);
                });
            }
        });
    }
    static race(promiseList) {
        let length = promiseList.length;
        return new Promise((resolve, reject) => {
            for (let i = 0; i < length; i++) {
                promiseList[i].then(val => {
                    resolve(val);
                }, err => {
                    reject(err);
                });
            }
        });
    }
}
