import * as React from "react"

type ImgProps = {
    src: string
    className?: string
}

const cache = new Map<string, HTMLImageElement>();

function draw(canvasRef: React.MutableRefObject<HTMLCanvasElement>, img: HTMLImageElement)
{
    const canvas = canvasRef.current;
    if(!canvas)
    {
        setTimeout(() => draw(canvasRef, img), 100);
        return;
    }
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, img.width, img.height);
}

const img = (props: ImgProps) => {
    const canvasRef = React.useRef<HTMLCanvasElement>()
    const canvas = <canvas className={props.className} ref={canvasRef}></canvas>
    if(cache.has(props.src))
    {
        const img = cache.get(props.src);
        if(img.naturalWidth > 0 && img.naturalHeight > 0)
            draw(canvasRef, img);
        else
            img.addEventListener("loadeddata", () => draw(canvasRef,img));
        return canvas;
    }
    const img = new Image();
    img.src = props.src;
    img.loading = "eager";
    cache.set(props.src, img);
    img.addEventListener("loadeddata", () => draw(canvasRef,img));
    return canvas
}

const CachedImg: React.FunctionComponent<ImgProps> = props => img(props)
export default CachedImg