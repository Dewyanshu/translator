import dotenv from "dotenv";
import express from "express";
import { glob } from 'glob'
import bodyParser from "body-parser";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as path from 'path';

import { connect_db } from './db/connect.db.js';
import { _PORT } from './constants.js';

dotenv.config({
    path: '../env'
});

const app = express();
const PORT = process.env.PORT || _PORT;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(bodyParser.urlencoded({ extended: true, limit: '16kb' }));
app.use(bodyParser.json({ limit: '16kb' }));
app.use(express.static("public"));

const loadRoutes = async () => {
    try {
        let route_list = await glob(process.env.API_PATH, {
            cwd: __dirname,
            ignore: '**/node_modules/**',
        });
        route_list.forEach(async (file) => {
            let route = await import(`file://${path.resolve(__dirname, file)}`);
            app.use(route.default);
        });
    } catch (error) {
        throw { status: 404, msg: error };
    }
};

// Start server and load routes.
( async () => {
    try {
        await loadRoutes();
        await connect_db();
        app.listen(PORT, (err) => {
            if (err) throw { status: 500, msg: err };
            console.log(`Server listening on port: ${PORT}`);
        });
    } catch (err) {
        if (err.status && err.msg) res.status(err.status).send(err.msg);
        else res.status(404).send({ 'Error Found: ': err.message });
    }
} )();