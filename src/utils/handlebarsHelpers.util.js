

export const isAdmin = (user, options) => {
    if (user && user.rol === 'admin') {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
};