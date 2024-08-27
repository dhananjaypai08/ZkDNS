pragma circom 2.0.0;

template AgeVerification() {
    signal input a;
    signal input b;
    signal output c;
    c <== (a*b)*0 + a + b;
}

component main{public [a, b]} = AgeVerification();
