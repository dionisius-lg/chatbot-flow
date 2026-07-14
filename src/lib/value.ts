/**
 * Checks if a given value is empty.
 * Criteria for empty includes: undefined, null, an empty array, an object with no keys,
 * an empty string (after trimming), or a number less than 1.
 *
 * @param {any} value - The value to check for emptiness.
 * @returns {boolean} `true` if the value is considered empty, otherwise `false`.
 *
 * @example
 * isEmpty(''); // true
 * isEmpty([]); // true
 * isEmpty({}); // true
 * isEmpty(0);  // true
 * isEmpty('hello'); // false
 */
export const isEmpty = (value: any): boolean => {
    if (value instanceof FormData || value instanceof Blob || value instanceof File) {
        return false;
    }
    return (
        value === undefined ||
        value === null ||
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === 'object' && Object.keys(value).length === 0) ||
        (typeof value === 'string' && value.trim().length === 0) ||
        (typeof value === 'number' && value === 0)
    );
};

/**
 * Validates whether the given string represents a valid date format.
 *
 * @param {string} value - The date string to validate.
 * @returns {boolean} `true` if the date is valid and parseable, otherwise `false`.
 *
 * @example
 * isValidDate('2026-07-02'); // true
 * isValidDate('not-a-date'); // false
 */
export const isValidDate = (value: string): boolean => {
    const dateValue: Date = new Date(value);

    return !isNaN(dateValue.getTime());
};

/**
 * Parses a date string into an object containing separate time components
 * based on the 'Asia/Jakarta' timezone.
 *
 * @param {string} value - The date string to parse.
 * @returns {Object} An object containing the formatted time components (year, month, date, hour, minute, second, dayname, monthname).
 *                   Returns an object with empty strings if the date is invalid.
 *
 * @example
 * dateParse('2026-07-02T10:00:00Z');
 * // Output: { year: '2026', month: '07', date: '02', hour: '17', minute: '00', second: '00', dayname: 'Thu', monthname: 'Jul' }
 */
export const dateParse = (value: string) => {
    let result = {
        year: '',
        month: '',
        date: '',
        hour: '',
        minute: '',
        second: '',
        dayname: '',
        monthname: '',
    };

    if (isValidDate(value)) {
        const dateValue = new Date(value);
        const [month, date, year] = dateValue
            .toLocaleDateString('default', {
                timeZone: 'Asia/Jakarta',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
            })
            .split('/');
        const [hour, minute, second] = dateValue
            .toLocaleTimeString('default', {
                timeZone: 'Asia/Jakarta',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
            })
            .split(':');
        const [monthname, dayname] = dateValue
            .toLocaleDateString('default', {
                weekday: 'short',
                month: 'short',
            })
            .split(' ');

        result = { year, month, date, hour, minute, second, monthname, dayname };
    }

    return result;
};

/**
 * Formats a number or numeric string into the Indonesian Rupiah (id-ID) currency format
 * without the currency symbol (Rp). Non-numeric characters in a string input are stripped automatically.
 *
 * @param {string | number} value - The number or numeric string to format.
 * @returns {string} The formatted number string using dot separators for thousands.
 *
 * @example
 * formatCurrency(1500000); // "1.500.000"
 * formatCurrency("Rp. 250.000,00"); // "250.000"
 */
export const formatCurrency = (value: string | number): string => {
    let result: number = 0;

    switch (true) {
        case typeof value === 'string': {
            const text = value.replace(/[^0-9]/g, '');
            result = Number(text);
            break;
        }
        case typeof value === 'number' && value >= 0:
            result = value;
            break;
    }

    return result.toLocaleString('id-ID');
};

/**
 * Delays the execution of subsequent code (sleep/delay) using a Promise-based timeout.
 * *Note:* The current milliseconds calculation multiplies seconds by 60 instead of 1000.
 *
 * @param {number} seconds - The duration to wait (defaults to 1 if empty or falsy).
 * @returns {Promise<void>} A Promise that resolves after the timeout period ends.
 *
 * @example
 * await sleep(2); // Delays execution before moving to the next line
 */
export const sleep = (seconds: number) => {
    const miliseconds: number = (seconds || 1) * 1000;
    return new Promise((resolve) => setTimeout(resolve, miliseconds));
};

/**
 * Generates a pseudo-random string of a specified length with optional character sets.
 * The baseline character set uses lowercase letters.
 *
 * @param {number} [length=32] - The desired length of the random string. Defaults to 6 if <= 0 or not an integer.
 * @param {Object} [options] - Configuration options for additional character sets.
 * @param {boolean} [options.capital=false] - Include uppercase letters (A-Z).
 * @param {boolean} [options.numeric=false] - Include numeric digits (0-9).
 * @param {boolean} [options.symbol=false] - Include symbols (!@#$%^&*?).
 * @returns {string} The generated random string based on the chosen options.
 *
 * @example
 * randomString(8, { capital: true, numeric: true }); // e.g., "aB3dE6gH"
 */
export const randomString = (
    length: number = 32,
    options: {
        capital?: boolean;
        numeric?: boolean;
        symbol?: boolean;
    } = { capital: false, numeric: false, symbol: false },
) => {
    let string = 'abcdefghijklmnopqrstuvwxyz';
    let result = '';

    if (length <= 0 || !Number.isInteger(length)) {
        length = 6;
    }

    if (options.capital === true) {
        string += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    }

    if (options?.numeric === true) {
        string += '1234567890';
    }

    if (options?.symbol === true) {
        string += '!@#$%^&*?';
    }

    for (let i = 0; i < length; i++) {
        const random = Math.floor(Math.random() * string.length);
        result += string.charAt(random);
    }

    return result;
};

/**
 * Validates whether the given string represents a valid IPv4 address.
 *
 * @param {string} value - The IP string to validate.
 * @returns {boolean} `true` if the IP is valid, otherwise `false`.
 *
 * @example
 * isValidIp('172.31.0.116'); // true
 * isValidIp('256.0.0.1');    // false
 */
export const isValidIp = (value: string): boolean => {
    if (!value) {
        return false;
    }

    const ipRegex = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

    return ipRegex.test(value.trim());
};

/**
 * Validates whether the given string represents a valid domain name format.
 *
 * @param {string} value - The domain string to validate.
 * @returns {boolean} `true` if the domain format is valid, otherwise `false`.
 *
 * @example
 * isValidDomain('webcc.synergix.co.id'); // true
 * isValidDomain('invalid_domain');      // false
 */
export const isValidDomain = (value: string): boolean => {
    if (!value) {
        return false;
    }

    const domainRegex = /^(?=.{1,253}$)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[A-Za-z]{2,63}$/;

    return domainRegex.test(value.trim());
};

/**
 * Validates whether the given string represents a valid host address (localhost, valid IP, or valid domain).
 *
 * @param {string} value - The host string to validate.
 * @returns {boolean} `true` if the host is valid, otherwise `false`.
 *
 * @example
 * isValidHost('localhost');            // true
 * isValidHost('172.31.0.116');         // true
 * isValidHost('webcc.synergix.co.id'); // true
 * isValidHost('invalid/host');         // false
 */
export const isValidHost = (value: string): boolean => {
    const host = value.trim();

    return host === 'localhost' || isValidIp(host) || isValidDomain(host);
};
