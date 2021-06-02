function Promise(executor) {
    this.promiseState = 'pending';
    this.promiseResult = null;
    this.callbackList = [];
    const resolve = val => {
        if (this.promiseState !== 'pending') {
            return;
        }
        this.promiseState = 'fulfilled';
        this.promiseResult = val;
        setTimeout(() => {
            // 调用成功的回调【callbackList存起来的】
            for (let callback of this.callbackList) {
                callback.onResolved(val);
            }
        });
    };
    const reject = err => {
        if (this.promiseState !== 'pending') {
            return;
        }
        this.promiseState = 'rejected';
        this.promiseResult = err;
        setTimeout(() => {
            for (let callback of this.callbackList) {
                callback.onRejected(err);
            }
        });
    };
    try {
        executor(resolve, reject);
    } catch (err) {
        reject(err);
    }
}
Promise.prototype.then = function (onResolved, onRejected) {
    let self = this;
    if (typeof onRejected !== 'function') {
        onRejected = err => {
            throw err;
        };
    }
    if (typeof onResolved !== 'function') {
        onResolved = val => val;
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
            setTimeout(()=>{
                handleCallback(onResolved);
            });
        }
        if (this.promiseState === 'rejected') {
            setTimeout(()=>{
                handleCallback(onRejected);
            });
        }
        if (this.promiseState === 'pending') {
            this.callbackList.push({
                onResolved: () => {
                    handleCallback(onResolved);
                },
                onRejected: err => {
                    handleCallback(onRejected);
                }
            });
        }
    });
};
Promise.prototype.catch = function (onRejected) {
    return this.then(undefined, onRejected);
};
Promise.resolve = function (val) {
    return new Promise((resolve, reject) => {
        if (val instanceof Promise) {
            val.then(value => {
                resolve(value);
            }, err => {
                reject(err);
            });
        } else {
            resolve(val);
        }
    });
};
Promise.reject = function (val) {
    return new Promise((resolve, reject) => {
        reject(val);
    });
};
Promise.all = function (promiseList) {
    let count = 0;
    let res = [];
    let length = promiseList.length;
    return new Promise((resolve, reject) => {
        for (let i = 0; i < length; i++) {
            promiseList[i].then(val => {
                count++;
                res[i] = val;
                if (count === length) {
                    resolve(val);
                }
            }, err => {
                reject(err);
            });
        }
    });
};
Promise.race = function (promiseList) {
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
};
