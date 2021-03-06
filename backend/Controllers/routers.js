const userService = require("../Services/UserService")();
const productService = require("../Services/ProductService")();
const rssService = require("./../Services/RSS")();
const groupService = require("./../Services/GroupService")();
const url = require("url");

module.exports = async function requestListener(req, res) {
    var loggedIn = false;
    res.setHeader("Access-Control-Allow-Origin", "*");
    ///// GET
    if (req.method === "GET") {
        const queryParam = url.parse(req.url, true).query;
        var key = Object.keys(queryParam)[0];
        console.log(key);
        /////////////////////// USERS ////////////////////////////////

        if (key === "users") {
            // http://localhost:3000/?users
            var data = await userService.getAllUsers();
            res.write(JSON.stringify(data));
        }
        if (key === "users/id") {
            // http://localhost:3000/?users/id=123456
            var data = await userService.getById(queryParam[key]);
            res.writeHead(data.statusCode);
            res.write(JSON.stringify(data));
            res.end();
        }
        if (key === "userFavourites/id") {
            // http://localhost:3000/userFavourites/id=123456
            var data = await userService.getUserFavourites(queryParam[key]);
            res.writeHead(data.statusCode);
            res.write(JSON.stringify(data));
            res.end();
        }

        /////////////////////// PRODUCTS ////////////////////////////

        if (key === "products") {
            // http://localhost:3000/?products
            if (checkToken() === true) {
                var data = await productService.getAllProducts();
                console.log(data);
                res.writeHead(data.statusCode);
                res.write(JSON.stringify(data));
                res.end();
            } else {
                res.writeHead("403");
                res.write("Restricted area. Please sign in first");
                res.end();
            }
        }

        if (key === "products/id") {
            // http://localhost:3000/?products/id=123
            var data = await productService.getProductById(queryParam[key]);
            res.writeHead(data.statusCode);
            res.write(JSON.stringify(data));
            res.end();
        }

        if (key === "products/category") {
            // http://localhost:3000/?products/category=salad
            var data = await productService.getProductsByCategory(
                queryParam[key]
            );
            res.writeHead(data.statusCode);
            res.write(JSON.stringify(data));
            res.end();
        }

        if (key === "rss") {
            // http://localhost:3000/?rss
            var data = (await rssService)
                .getRssFeed()
                .then((data) => {
                    res.write(JSON.stringify(data));
                    res.end();
                })
                .catch((err) => console.log(err));
        }

        if (key === "group/id") {
            // http://localhost:3000/?group/id=123
            let groupId = queryParam[key];
            var data = groupService
                .getGroupById(groupId)
                .then((data) => {
                    console.log(data);
                    res.write(JSON.stringify(data));
                    res.end();
                })
                .catch((err) => console.log(err));
        }

        if (key === "checkUserInAGroup/id") {
            // http://localhost:3000/?checkUserInAGroup/id=123
            let userId = queryParam[key];
            var data = await groupService
                .checkUserInAGroup(userId)
                .then((data) => {
                    console.log(data);
                    res.write(JSON.stringify(data));
                    res.end();
                })
                .catch((err) => console.log(err));
        }

        if (key === "statistics") {
            // http://localhost:3000/?statistics
            var data = await (await rssService)
                .getStatistics()
                .then((data) => {
                    res.write(JSON.stringify(data));
                    res.end();
                })
                .catch((err) => console.log(err));
        }
    }

    ///// POST
    if (req.method === "POST") {
        let body = "";
        var route = req.url.split("/")[1];
        req.on("data", async (chunk) => {
            body += chunk.toString(); // convert chunk Buffer to string
            body = JSON.parse(body); // convert string to json
            console.log("BODY", body);
            //////// USERS /////////
            if (route === "login") {
                // http://localhost:3000/login
                let request = {
                    email: body.email,
                    password: body.password,
                };
                var data = await userService.login(request);
                if (data.statusCode === 200) {
                    loggedIn = true;
                } else {
                    loggedIn = false;
                }
                res.writeHead(data.statusCode);
                res.write(JSON.stringify(data));
                res.end();
            }
            if (route === "register") {
                // http://localhost:3000/register
                let request = {
                    firstName: body.firstName,
                    lastName: body.lastName,
                    email: body.email,
                    password: body.password,
                    favourites: [],
                };
                var data = await userService.register(request);
                console.log("user", data);
                res.writeHead(data.statusCode);
                res.write(JSON.stringify(data));
                res.end();
            }

            if (route === "addUser") {
                // http://localhost:3000/addUser
                var user = {
                    firstName: body.firstName,
                    lastName: body.lastName,
                    email: body.email,
                    password: body.password,
                    favourites: body.favourites,
                };
                var data = await userService.addUser(user);
                res.writeHead(data.statusCode);
                res.write(JSON.stringify(data));
                res.end();
            }

            if (route === "addFavourite") {
                var data = await userService.addToFavourites(
                    body.userId,
                    body.product
                );
                res.writeHead(data.statusCode);
                res.write(JSON.stringify(data));
                res.end();
            }

            ///////// PRODUCTS //////////

            if (route == "addProduct") {
                // http://localhost:3000/addProduct
                var product = {
                    name: body.name,
                    photoPath: body.photoPath,
                    category: body.category,
                    description: body.description,
                    ingredients: body.ingredients,
                    specific: body.specific,
                    price: body.price,
                    restrictions: body.restrictions,
                    restaurants: body.restaurants,
                };
                var data = await productService.addProduct(product);
                res.writeHead(data.statusCode);
                res.write(JSON.stringify(data));
                res.end();
            }

            ///////// GROUPS /////////

            if (route === "addToGroup") {
                // http://localhost:3000/addToGroup
                var productId = body.productId;
                var productName = body.name;
                var productPhoto = body.photoPath;
                var groupId = body.groupId;
                var data = await groupService.postToGroup(
                    productId,
                    productName,
                    productPhoto,
                    groupId
                );
                res.writeHead(data.statusCode);
                res.write(JSON.stringify(data));
                res.end();
            }

            if (route === "addGroup") {
                // http://localhost:3000/addGroup
                var request = {
                    name: body.name,
                    membersId: body.membersId,
                    productsId: body.productsId,
                };
                console.log(request);
                var data = await groupService.addGroup(request);
                console.log("data", data);
                res.writeHead(data.statusCode);
                res.write(JSON.stringify(data));
                res.end();
            }
        });
    }
};

function checkToken() {}
