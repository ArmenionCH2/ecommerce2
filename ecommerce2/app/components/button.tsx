interface buttonProps{

    type: "button" | "submit" | "reset";
    onClick?: ()=> void;
    text?: string;
}

export default function Button({type, onClick, text}: buttonProps){

    return(

        <button 
        className="border border-green-200"
        type={type} 
        onClick={onClick}>
        {text}
        </button>
    );
}