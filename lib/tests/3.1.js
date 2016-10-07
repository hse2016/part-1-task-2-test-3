"use strict";

var assert = require("assert");

var adapter = global.adapter;
var deferred = adapter.deferred;
var resolved = adapter.resolved;
var rejected = adapter.rejected;

var dummy = { dummy: "dummy" }; // we fulfill or reject with this when we don't intend to test against it

describe("3.1. Promise static", function () {
    describe("3.1.1. Promise.all", function () {
        describe("3.1.1.1: Resolved", function () {
            specify("when empty array", function (done) {
                adapter
                    .all([])
                    .then(() => done());
            });

            specify("when all immediate resolved", function (done) {
                let promises = Array.from(Array(10), _ => resolved());
                adapter
                    .all(promises)
                    .then(() => done());
            });

            specify("when all async resolved", function (done) {
                let promises = Array.from(Array(10), _ => {
                    let d = deferred();

                    setTimeout(d.resolve, 100);

                    return d;
                });

                adapter
                    .all(promises)
                    .then(() => done());
            });

            specify("with simple type and promise", function (done) {
                let d1 = deferred();
                setTimeout(d1.resolve, 100);

                adapter
                    .all([dummy, d1])
                    .then(() => done());
            });
        });

        describe("3.1.1.2: Rejected", function () {
            specify("when immediate rejected", function (done) {
                let promises = Array.from(Array(10), _ => rejected());
                promises.push(dummy);

                adapter
                    .all(promises)
                    .then(null, () => done());
            });

            specify("when async rejected", function (done) {
                let d1 = deferred();
                let d2 = deferred();
                let promises = [
                    resolved().then(() => d1.promise),
                    resolved().then(() => d2.promise),
                    dummy
                ];

                setTimeout(d1.resolve);
                setTimeout(d2.reject, 100);

                adapter
                    .all(promises)
                    .then(null, () => done());
            });
        });
    });

    describe("3.1.2. Promise.race", function () {
        describe("3.1.2.1: Resolved", function () {
            specify("when empty array", function (done) {
                adapter
                    .race([])
                    .then(() => done());
            });

            specify("when object and fullfiled promise, return object", function (done) {
                let d2 = deferred();
                let promises = [
                    dummy,
                    resolved().then(() => d2.promise)
                ];

                setTimeout(d2.resolve);

                adapter
                    .race(promises)
                    .then((r) => {
                        assert.strictEqual(r, dummy);
                        done();
                    });
            });

            specify("when object and rejected promise, return object", function (done) {
                let d2 = deferred();
                let promises = [
                    dummy,
                    resolved().then(() => d2.promise)
                ];

                setTimeout(d2.reject);

                adapter
                    .race(promises)
                    .then((r) => {
                        assert.strictEqual(r, dummy);
                        done();
                    });
            });

            specify("when two, return first resolved", function (done) {
                let d1 = deferred();
                let d2 = deferred();
                let promises = [
                    resolved().then(() => d1.promise),
                    resolved().then(() => d2.promise)
                ];

                setTimeout(() => d1.resolve(10), 100);
                setTimeout(() => d2.resolve(dummy));

                adapter
                    .race(promises)
                    .then((r) => {
                        assert.strictEqual(r, dummy);
                        done();
                    });
            });
        });

        describe("3.1.2.2: Rejected", function () {
            specify("when immediate rejected", function (done) {
                adapter
                    .race([rejected(dummy)])
                    .then(null, (r) => {
                        assert.strictEqual(r, dummy);
                        done();
                    });
            });

            specify("when async rejected", function (done) {
                let d1 = deferred();
                let promises = [
                    resolved().then(() => d1.promise)
                ];

                setTimeout(() => d1.reject(dummy), 100);

                adapter
                    .race(promises)
                    .then(null, (r) => {
                        assert.strictEqual(r, dummy);
                        done();
                    });
            });

            specify("when async rejected before fullfilled", function (done) {
                let d1 = deferred();
                let d2 = deferred();
                let promises = [
                    resolved().then(() => d1.promise),
                    resolved().then(() => d2.promise)
                ];

                setTimeout(() => d1.reject(dummy), 50);
                setTimeout(() => d2.resolve(20), 100);

                adapter
                    .race(promises)
                    .then(null, (r) => {
                        assert.strictEqual(r, dummy);
                        done();
                    });
            });
        });
    });

    describe("3.1.3. Promise.queue", function () {
        describe("3.1.3.1: Resolved", function () {
            specify("when empty array", function (done) {
                adapter
                    .queue([])
                    .then(() => done());
            });

            specify("when object and fullfiled promise", function (done) {
                let d2 = deferred();
                let promises = [
                    dummy,
                    resolved().then(() => d2.promise)
                ];

                setTimeout(d2.resolve);

                adapter
                    .queue(promises)
                    .then((r) => {
                        assert.strictEqual(r, dummy);
                        done();
                    });
            });

            specify("when two fullfilled", function (done) {
                let d1 = deferred();
                let d2 = deferred();
                let firstCall = false;
                let secondCallAfterFirst = false;
                let promises = [
                    resolved().then(() => {
                        firstCall = true;
                        return d1.promise;
                    }),
                    resolved().then(() => {
                        secondCallAfterFirst = firstCall;
                        return d2.promise;
                    })
                ];

                setTimeout(() => d1.resolve(), 100);
                setTimeout(() => d2.resolve());

                adapter
                    .queue(promises)
                    .then((r) => {
                        assert.strictEqual(secondCallAfterFirst, true);
                        done();
                    });
            });
        });

        describe("3.1.3.2: Rejected", function () {
            specify("when immediate rejected", function (done) {
                adapter
                    .queue([rejected(dummy)])
                    .then(null, (r) => {
                        assert.strictEqual(r, dummy);
                        done();
                    });
            });

            specify("when async rejected", function (done) {
                let d1 = deferred();
                let promises = [
                    resolved().then(() => d1.promise)
                ];

                setTimeout(() => d1.reject(dummy), 100);

                adapter
                    .queue(promises)
                    .then(null, (r) => {
                        assert.strictEqual(r, dummy);
                        done();
                    });
            });

            specify("when object and rejected promise", function (done) {
                let d2 = deferred();
                let promises = [
                    dummy,
                    resolved().then(() => d2.promise)
                ];

                setTimeout(d2.reject);

                adapter
                    .queue(promises)
                    .then(null, done);
            });

            specify("when async rejected before fullfilled", function (done) {
                let d1 = deferred();
                let d2 = deferred();
                let promises = [
                    resolved().then(() => d1.promise),
                    resolved().then(() => d2.promise)
                ];

                setTimeout(() => d1.reject(dummy), 50);
                setTimeout(() => d2.resolve(20), 100);

                adapter
                    .queue(promises)
                    .then(null, (r) => {
                        assert.strictEqual(r, dummy);
                        done();
                    });
            });
        });
    });
});
