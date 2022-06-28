const bcrypt = require("bcrypt");
const db = require("../db");
const { BCRYPT_WORK_FACTOR } = require("../config");
const { UnauthorizedError, BadRequestError } = require("../utils/error");

class User {
    static async login(credentials) {
        /* user should submit their email and password
                                                                        if any of these fields are missing, throw an error
                                                                        lookup the user in the db by email
                                                                        if a user is found, compare the submitted password
                                                                        with the password in the db
                                                                        if there is a match, return the user
                                                                        if any of this goes wrong, throw an error
                                                                        */
    }

    static async register(credentials) {
        /*user should submit their email, pw, rsvp status, and # of guests
                                                                    if any of these fields are missing, throw an error
                                                                    make sure no user already exists in the system with that email
                                                                    if one does, throw an error
                                                                    take the users password, and hash it
                                                                    take the users email, and lowercase it
                                                                    create a new user in the db with all their info
                                                                    return the user
                                                        */
        const requiredFields = [
            "email",
            "password",
            "first_name",
            "last_name",
            "location",
        ];

        requiredFields.forEach((field) => {
            if (!credentials.hasOwnProperty(field)) {
                throw new BadRequestError(`Missing ${field} in request body`);
            }
        });

        if (credentials.email.indexOf("@") <= 0) {
            throw new BadRequestError("invalid email");
        }

        const existingUser = await User.fetchUserByEmail(credentials.email);
        if (existingUser) {
            throw new BadRequestError(`Duplicate email: ${credentials.email}`);
        }

        const hashedPassword = await bcrypt.hash(
            credentials.password,
            BCRYPT_WORK_FACTOR
        );

        const lowerCasedEmail = credentials.email.toLowerCase();

        const result = await db.query(
            `
            INSERT INTO users (
                email,
                password,
                first_name,
                last_name,
                location
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, email, first_name, last_name, location, date;
        `, [
                lowerCasedEmail,
                hashedPassword,
                credentials.first_name,
                credentials.last_name,
                credentials.location,
            ]
        );

        const user = result.rows[0];

        return user;
    }

    static async fetchUserByEmail(email) {
        if (!email) {
            throw new BadRequestError("No email provided");
        }

        const query = `SELECT * FROM users WHERE EMAIL = $1`;

        const result = await db.query(query, [email.toLowerCase()]);

        const user = result.rows[0];

        return user;
    }
}

module.exports = User;