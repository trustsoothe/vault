export const isValidPocketAddress = (address: string): boolean => {
    if (address.length != 40) {
        return false;
    }
    return true;
}
