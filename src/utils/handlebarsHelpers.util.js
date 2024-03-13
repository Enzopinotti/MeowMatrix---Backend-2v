

export const isAdmin = (user, options) => {
    if (user && user.rol === 'admin') {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
};

export const isNotPremium = (user, options) => {
    if (user && user.rol !== 'premium') {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
};

export const isPremium = (user, options) => {
    if (user && user.rol === 'premium') {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
};

export const capitalize = (str) => {
    if (!str || typeof str !== 'string') {
        return '';
    }

    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};


export const formatDate = (date) => {
    if (!date || !(date instanceof Date)) {
        return '';
    }
    
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    
    return `${day < 10 ? '0' + day : day}/${month < 10 ? '0' + month : month}/${year}`;
};

export const formatTime = (date) => {
    if (!date || !(date instanceof Date)) {
        return '';
    }
    
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    
    return `${hours < 10 ? '0' + hours : hours}:${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
};