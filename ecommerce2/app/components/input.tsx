interface inputProps{

    type: "text" | "password" | "email";
    name: string;
    placeholder?: string;
}

export default function Input({type, name, placeholder}: inputProps){

    return(

        <input 
        className=" border border-green-200"
        type={type} 
        name={name} 
        placeholder={placeholder} />
    );
}