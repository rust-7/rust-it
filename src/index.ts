import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants";
import { Post } from "./entities/Post";
import microConfig from './mikro-orm.config';
import express from "express";

const main = async () => {
    const orm = await MikroORM.init(microConfig);
    await orm.getMigrator().up();

    const app = express();
    
    app.get('/', (_, res) => {
        res.send("hi");
    })
    
    app.listen(4000, () => {
        console.log('server: localhost:4000');
    })
};

main().catch((err) => {
    console.log(err);
});