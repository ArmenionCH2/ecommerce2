import Input from "../../components/input";
import Button from "../../components/button";

import { registerFunc } from "./register";


export default function RegisterPage() {


    return (

        <div>
            <h1>Register</h1>

            <form action={registerFunc} className="flex gap-2">
                <Input type="email" name="email" placeholder="Email..."></Input>
                <Input type="password" name="password" placeholder="Password..."></Input>

                <Button type="submit" text="Register"></Button>
            </form>
        </div>
    );
}