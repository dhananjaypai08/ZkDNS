pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";

template ZkDNS() {
    signal input domainHash;
    signal input ipAddressHash;
    signal input recordTypeHash;
    signal input expiryHash;

    // Private inputs
    signal input domain;
    signal input ipAddress;
    signal input recordType;
    signal input expiry;
    signal input secretKey;

    signal domainHashCheck;
    signal ipAddressHashCheck;
    signal recordTypeHashCheck;
    signal expiryHashCheck;

    component domainHasher = Poseidon(2);
    domainHasher.inputs[0] <== domain;
    domainHasher.inputs[1] <== secretKey;
    domainHashCheck <== domainHasher.out;

    component ipAddressHasher = Poseidon(2);
    ipAddressHasher.inputs[0] <== ipAddress;
    ipAddressHasher.inputs[1] <== secretKey;
    ipAddressHashCheck <== ipAddressHasher.out;

    component recordTypeHasher = Poseidon(2);
    recordTypeHasher.inputs[0] <== recordType;
    recordTypeHasher.inputs[1] <== secretKey;
    recordTypeHashCheck <== recordTypeHasher.out;

    component expiryHasher = Poseidon(2);
    expiryHasher.inputs[0] <== expiry;
    expiryHasher.inputs[1] <== secretKey;
    expiryHashCheck <== expiryHasher.out;

    domainHash === domainHashCheck;
    ipAddressHash === ipAddressHashCheck;
    recordTypeHash === recordTypeHashCheck;
    expiryHash === expiryHashCheck;
}

component main { public [domainHash, ipAddressHash, recordTypeHash, expiryHash] } = ZkDNS();