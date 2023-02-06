exports.safeUser = (user) => {
    const safeUser = user.toObject();
    delete safeUser.password;
    delete safeUser.__v;
    delete safeUser._id;
    delete safeUser.tokens;
    return safeUser;
}