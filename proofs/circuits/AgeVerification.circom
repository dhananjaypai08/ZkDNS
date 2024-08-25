pragma circom 2.0.0;

template AgeVerification() {
    signal input age;
    signal input threshold;
    signal output out;

    signal diff;
    diff <== age-threshold;
    out <== diff;

    
}

component main = AgeVerification();