import Input from "../../components/input";
import Button from "../../components/button";


export default function LoginPage() {


    return (

        <div>
            <h1>Login</h1>

            <form action="" className="flex gap-2">
                <Input type="text" name="username" placeholder="Username..."></Input>
                <Input type="password" name="password" placeholder="Password..."></Input>

                <Button type="submit" text="Login:"></Button>
            </form>
        </div>
    );
}