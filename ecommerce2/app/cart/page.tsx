import Input from "../components/input";
import Button from "../components/button";

export default function cartPage() {


    return (

        <div>
            <h1>Cart</h1>

            <form action="" className="flex gap-2">
                <Input type="text" name="username" placeholder="Find product..."></Input>
                

                <Button type="submit" text="Find"></Button>
            </form>

            <h1>Products:</h1>
        </div>
    );
}