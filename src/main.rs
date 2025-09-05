use std::fs;
use std::io;

fn main() {
    // let x: i32 = -4;
    // let y: u32 = 5;  
    // let z: f32 = 1.23;
    // println!("x: {}, y: {}, z: {}", x, y, z);
    // boolean
    // let is_male: bool = true;// by default, rust is true and variables are immutable
    // let mut is_above_18: bool = true;// so to make it mutable, we use mut keyword

    // if is_male {
    //     println!("You are a male");
    // }
    // else{
    //     println!("You are not female");
    // }

    // if is_male && is_above_18 {
    //     println!("You are a male and above 18");
    // }

    //string in rust string are one of the most important data types , they are tough to work with.

    //so this in is not possible because string are not indexed.

    // fn stringsss() {
    //     let greeting: String =  String::from("hello world");
    //     // println!("{}",greeting);

    //     let char1: Option<char> = greeting.chars().nth(1000);
    //     println!("char1: {}",char1);
    // }
    // stringsss(); 
    // this is the right way to do it.
    // fn rightway() {
    //     let greeting: String = String::from("hello world");
    //     println!("{}",greeting);
    //     let char1: Option<char> = greeting.chars().nth(4);

    //     match char1 {
    //         Some(c) => println!("char1: {}",c),
    //         None => println!("no character at index 4")
    //     }
    // }
    // rightway();


    // conditional statements
    // if else if else
    // let is_even: bool = true;
    // if is_even {
    //     println!("The number is even");
    // }
    // else if !is_even {
    //     println!("The number is odd");
    // }

    // loops
    // fn loops() {
    //     for i in 0..10 {
    //         print!("{}",i);
    //     }
    // }
    // loops();


    //iterating over a string , array or maps
    // let sentence: String = String::from("yuvraj pandey");
    // let first_word: String = get_first_word(sentence);
    // print!("First word is:{}",first_word);

    // fn get_first_word(sentence: String) -> String  {
    //     let mut ans: String = String::from("");
    //     for char in sentence.chars() {
    //         ans.push_str(&char.to_string());
    //         if char == ' ' {
    //             break;
    //         }
    //     }
    //      ans
    // }


    // functions in rust


    // let a: i32 = 10;
    // let b: i32 = 10;
    // let sum: i32 = do_sum(a,b);
    // println!("Sum of {} and {} is {}" , a,b,sum);

    // fn do_sum(a: i32, b: i32) -> i32 {
    //     return a + b;
    // }


    // so to understand arrays, vectors, objects , we first need to understand memory allocation in rust.
    // stack definition - stack is a region of memory that is used to store local variables and function calls.
    // heap definition - heap is a region of memory that is used to store dynamic data.

    // stack allocation - stack allocation is the process of allocating memory on the stack.
    // heap allocation - heap allocation is the process of allocating memory on the heap.

    // stack allocation is faster than heap allocation.
    // heap allocation is slower than stack allocation.

    // stack allocation is used for static data.
    // heap allocation is used for dynamic data.

    // stack allocation is used for local variables.
    // heap allocation is used for dynamic data.



    //ownership and borrowing
    // fn main2() {

    //         let s1: String = String::from("hi there");
    //         let s2: String = s1;
    //         println!("{}",s1);
    // }

    // main2();

    //how can we pass owner ship 

    // fn ownership() {
    //     let my_string:String = String::from("hello");
    //     takes_ownership(some_string: my_string);
    //     println!("{}", my_string); //This line would cause an error because my_string ownership has been moved

    // }
    // fn takes_ownership(some_string: String) {
    //     println!("{}",some_string); // some_string now owns the dat
    // }
    // ownership();


    //how can we pass ownership of a variable to a function without moving it   

    //how can we get back the ownership of a variable from a function

    // fn ownership2() {
    //     let my_string:String = String::from("hello");
    //     let my_string2: String = takes_ownership(my_string);
    //     println!("{}", my_string2);
    // }
    // fn takes_ownership(some_string: String) -> String {
    //     println!("{}", some_string);
    //     return some_string;
    // }
    // ownership2();
    

    // but if you want to pass the same string over to the function? you dont want to clone it , and you want to return back ownership to the original function?
    //the mutable way 
    // fn ownership3() {
    //     let mut s1 = String::from("Hello");
    //     s1 = takes_ownership2(s1);
    //     println!("{}", s1);
    // }
    // fn takes_ownership2(some_string: String) -> String{
    //     println!("{} + world", some_string );
    //     return some_string;
    // }
    // ownership3();

    //Borrowing in rust
    // fn borrowing() {
    //     let s1: String = String::from("Hello");
    //     borrow_variable(&s1);// Pass a reference to s1
    //     println!("{}", s1);// this is valid because ownership is not transferred to the function
    // }
    // fn borrow_variable(some_string: &String) {
    //     println!("{}", some_string);// some_string is a reference to the string s1
    // }
    // borrowing(); 

    //mutable borrowing  remember we can only have one mutable reference to a variable at a time.
    // fn mutable_borrowing() {
    //     let mut s1: String = String::from("Hello");
    //     update_string(&mut s1);
    //     println!("{}", s1);
    // }   

    // fn update_string(s: &mut String) {
    //     s.push_str("world");
    // }
    // mutable_borrowing();



    //Structs in rust

    // structs are user defined data types that are used to group related data together.

    // struct User {
    //     name: String,
    //     age: u32,
    //     active: bool,
    // }

    // fn main2() {

    //     let user = User {
    //         name: String::from("John"),
    //         age:19,
    //         active: true,
    //     };
    //     print!("{} is {} years old and.", user.name, user.age);
    // }

    // unit structs are structs that have no fields.


    // Implementing methods on structs

    // struct Rect {
    //     width: u32,
    //     height: u32,
    // }

    // impl Rect {
    //     fn area(&self) -> u32 {
    //         self.width * self.height
    //     }
    //     fn perimeter(&self) -> u32 {
    //         2 * (self.width + self.height)
    //     }
        

    // }
    // fn main3() {
    //     let rect = Rect {
    //         width: 10,
    //         height:20,
    //     };
    //     println!("The area of the rectangle is {}", rect.area());
    //     println!("The perimeter of the rectangle is {}", rect.perimeter());
    // }



    // Enums in rust
     
     enum Shape {
        Circle(f32),
        Rectangle(f32, f32),
        Square(f32),
     }

     // function to calculate the area of a shape
     fn calculate_area(shape: Shape) -> f32 {
        let ans: f32 = match shape {
            Shape::Circle(radius) => 3.14 * radius * radius,
            Shape::Rectangle(width, height) => {
                print!("HI There ");
                width * height
            },
            Shape::Square(side) => side * side 
        };
      return ans;
     }

     fn enumsmain() {
        let circle: Shape = Shape::Circle(5.0);
        let rectangle: Shape = Shape::Rectangle(10.0, 20.0);
        let square: Shape = Shape::Square(10.0);

        println!("Area of circle is {}", calculate_area(circle));
        println!("Area of rectangle is {}", calculate_area(rectangle));
        println!("Area of square is {}", calculate_area(square));
        
     }
     enumsmain();

     

     //Error handling in rust
     fn error_handling() {
        let res: Result<String , io::Error> = fs::read_to_string("file.txt");
        match res {
            Ok(content) => println!("Content of file is {}", content),
            Err(err) => println!("Error reading file: {}", err),
        }
     
     }
     error_handling();


     // option enum in rust

     //whenever we have a case where there might be null value, we use option enum

     fn find_first_a(s: String) -> Option<i32> {
        for (index, character) in s.chars().enumerate( ) {
            if character == 'a' {
                return Some(index as i32);
            }
        }
        None
     }

     fn option_main() {
        let my_string: String = String::from("rajual");
        let res: Option<i32> = find_first_a(my_string);

        match res {
            Some(index) => println!("First 'a' is at index {}", index),
            None => println!("The letter 'a' is not present in the string"),
        }
     }
     option_main();
}





 