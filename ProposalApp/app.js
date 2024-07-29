const express = require('express');
const mysql =require('mysql2');
const multer =require('multer');

const app =express();

//create mysql connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'c237_proposalapp'
});
connection.connect((err) =>{
    if (err){
        console.log('Error connecting to MySQL', err);
        return;
    }
    console.log('Connected to MySQL database');
});

//set up view engine
app.set('view engine','ejs');

//enable static files
app.use(express.static('public'));

//setup multer for file uploads
const storage =multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,'public/images');
    },
    filename: (req,file,cb)=>{
        cb(null,file.originalname);
    }
});
const upload = multer({storage: storage});

//app routing -CRUD

// -------- [R] Display All Products --------
app.get("/",(req,res)=>{
    
    //formulate my sql statement
    const sql = "SELECT * FROM `products`";

    //fetch data from MySQL
    connection.query(sql,(error,results)=>{
        if (error){
            console.error('Database query error:',error.message);
            return res.status(500).send("Error retrieving products");
        }
        //if no error, render HTML page with the results
        res.render('index',{products:results});
    });
});
// [R] Search for apple products
app.get('/search', (req, res) => {
    const query = req.query.query;
    const sql = "SELECT * FROM products WHERE productName LIKE ?";
    connection.query(sql, [`%${query}%`], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send("Error retrieving products");
        }
        res.render('index', { products: results });
    });
});





// -------- [R] Display ONE product from table --------
app.get('/product/:id', (req,res)=>{
    //retrieve product id from request parameter (part of url)
    const prodId = req.params.id

    //formulate the sql to retrieve the product by id 
    const sql ="SELECT * FROM products WHERE productid =?;";

    //fetch data
    connection.query(sql, [prodId], (error,results)=>{
        if (error){
            console.error("Database query error:",error.message);
            return res.status(500).send("Error retrieving products by Id");

        }
        //check if any product is returned
        if (results.length > 0) {
            res.render('product', {product: results[0]});
        } else {
            res.status(404).send("Product not found");
        }
    });
});
//enable static files
app.use(express.static('public'));

//enable form processing
app.use(express.urlencoded({ extended: true }));


// -------- Add product - Display blank form--------
app.get('/addProduct',(req,res)=>{
    res.render('addProduct');
});
// --------[C] Add product - After clicking save--------
app.post('/addProduct', upload.single('image'), (req, res) => {
    const { productName, productDesc, quantity, price } = req.body;

    // handle image uploading
    let image;
    if (req.file) {
        image = req.file.filename;
    } else {
        image = null;
    }

    const sql = 'INSERT INTO products (productName, productDesc, quantity, price, image) VALUES (?, ?, ?, ?, ?)';
    connection.query(sql, [productName, productDesc, quantity, price, image], (error, results) => {
        if (error) {
            console.error("Error adding product:", error);
            return res.status(500).send('Error adding product');
        } else {
            res.redirect('/');
        }
    });
});
// [R] Display Discount Code Page
app.get('/discount', (req, res) => {
    res.render('discount');
});z

//[R] Make a Frequently asked questions page
app.get('/faq', (req, res) => {
    res.render('faq');
});

// --------[R] get ONE product to be updated--------
app.get("/editProduct/:id",(req,res)=>{
    //retrieve the product id from the request parameter(url)
    const productId=req.params.id;
    
    //formulate the sql
    const sql = "SELECT * FROM products WHERE productId=?";

    //execute the query to fetch the data
    connection.query(sql,[productId],(error,results)=>{
            if (error) {
                console.error("Database query error:",error.message);
                return res.status(500).send("Error retrieving product");

            }
            // when no error
            if (results.length>0) {
                res.render("editProduct",{product: results[0]});
            } else {
                res.render("editProduct",{product: null})
            }
    });
});

// --------[U] update product - after press SAVE button--------
app.post("/editProduct/:id",upload.single('image'), (req,res)=>{
    //retrieve product id from request parameter(URL)
    const productId = req.params.id;

    //retrieve the updated values from the request body
    const {name,productDesc,quantity,price}=req.body;

    //handle image upload
    let image = req.body.currentImage;
    if (req.file) {
        image = req.file.filename;
    }

    //formulate the sql
    const sql = "UPDATE products SET productName=?,productDesc=?,quantity=?,price=?, image=? WHERE productId=?"

    //execute query to update table with updated values
    connection.query(sql,[name,productDesc,quantity,price,image,productId],(error,results)=>{
        if(error){
            console.error("Database query error:", error.message);
            return res.status(500).send("Error updating product");
        }
        // when no error - redirect to index page
        res.redirect("/");
    })
});
// --------[D] delete product --------
app.get("/deleteProduct/:id",(req,res)=>{
    //retrieve product id from request parameter (URL)
    const productId=req.params.id;

    //formulate the sql
    const sql = "DELETE FROM products WHERE productId=?";

    //execute the query to delete the data
    connection.query(sql,[productId],(error,results)=>{
        if (error) {
            console.error("Database query error: ",error.message)
           return res.status(500).send("Error deleting product");
        }
        // when no error redirect to index page
        res.redirect("/");
    });
});






const PORT= process.env.PORT || 3000;
app.listen(PORT , ()=>console.log(
    `Server running at http://localhost:${PORT}`
))