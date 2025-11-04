import * as React from "react"

type ImgProps = {
    src: string
    className?: string
}

class CachedImg extends React.Component<ImgProps> {
    private static readonly _cache = new Map<
        string,
        HTMLImageElement | HTMLVideoElement | VideoFrame[]
    >()
    private static readonly videoExtensions = ["mp4", "webm", "mkv", "mov"]
    private readonly _canvasRef = React.createRef<HTMLCanvasElement>()
    private readonly _maxCanvasDimension = 256
    private _needsRescaling: boolean = true
    private _imgSource: HTMLImageElement | HTMLVideoElement | VideoFrame[] | null = null

    constructor(props: ImgProps) {
        super(props)
    }

    private isVideo(url: string): boolean {
        const extensionSearch = /\.(\w{3,4})(?:$|\?)/.exec(url)
        return (
            extensionSearch &&
            extensionSearch.length > 1 &&
            CachedImg.videoExtensions.includes(extensionSearch[1])
        )
    }

    private isGif(url: string)
    {
        const extensionSearch = /\.(\w{3,4})(?:$|\?)/.exec(url)
        return extensionSearch &&
            extensionSearch.length > 1 && extensionSearch[1] === "gif"
    }

    private async loadImage(url: string): Promise<VideoFrame[] | null>
    {
        const response = await fetch(url);
        if(!response.ok)
            return null;
        const data = await response.bytes();
        const contentType = response.headers.get("content-type");
        if(!ImageDecoder.isTypeSupported(contentType))
            return null;
        const decoder = new ImageDecoder({data, type: contentType})
        let frameIndex = 0;
        const frames: VideoFrame[] = [];
        while(true)
        {
            try
            {
                const image = await decoder.decode({frameIndex, completeFramesOnly: true});
                frames.push(image.image)
                frameIndex++;
            }
            catch(e){
                if(e instanceof RangeError)
                    break;
            }
        }
        return frames;
    }

    private draw(img: HTMLImageElement | HTMLVideoElement | VideoFrame) {
        const canvas = this._canvasRef.current
        if (!canvas || !img) {
            return
        }
        const width =
            img instanceof HTMLImageElement
                ? img.naturalWidth
                : img instanceof HTMLVideoElement ? img.videoWidth : img.displayWidth
        const height =
            img instanceof HTMLImageElement
                ? img.naturalHeight
                : img instanceof HTMLVideoElement ? img.videoHeight : img.displayHeight
        if (this._needsRescaling) {
            if (
                width > this._maxCanvasDimension ||
                height > this._maxCanvasDimension
            ) {
                const scaleFactor = Math.max(
                    width / this._maxCanvasDimension,
                    height / this._maxCanvasDimension,
                )
                canvas.width = width / scaleFactor
                canvas.height = height / scaleFactor
            } else {
                canvas.width = width
                canvas.height = height
            }
        }
        const ctx = canvas.getContext("2d")
        ctx.drawImage(
            img,
            0,
            0,
            width,
            height,
            0,
            0,
            canvas.width,
            canvas.height,
        )
    }

    render(): React.ReactNode {
        const canvas = (
            <canvas
                className={this.props.className}
                ref={this._canvasRef}></canvas>
        )
        if (CachedImg._cache.has(this.props.src)) {
            this._imgSource = CachedImg._cache.get(this.props.src)
        } else {
            if (this.isVideo(this.props.src)) {
                this._imgSource = document.createElement("video")
                this._imgSource.loop = true
                this._imgSource.muted = true
                this._imgSource.autoplay = true
                this._imgSource.src = this.props.src
            } else if (this.isGif(this.props.src)){
                this._imgSource = []
                this.loadImage(this.props.src).then(f => {
                    (this._imgSource as VideoFrame[]).push(...f);
                    this.forceUpdate();
                })
            } else {
                this._imgSource = new Image()
                this._imgSource.loading = "eager"
                this._imgSource.src = this.props.src
            }
            CachedImg._cache.set(this.props.src, this._imgSource)
        }
        if (this._imgSource instanceof HTMLImageElement) {
            this._imgSource
                .decode()
                .then(() => this.draw(this._imgSource as HTMLImageElement))
                .catch(() => this.forceUpdate())
        } else if (this._imgSource instanceof HTMLVideoElement) {
            const requestFrame = () => {
                this.draw(this._imgSource as HTMLVideoElement)
                ;(
                    this._imgSource as HTMLVideoElement
                ).requestVideoFrameCallback(requestFrame)
            }
            if (this._imgSource.readyState < this._imgSource.HAVE_CURRENT_DATA)
                this._imgSource.addEventListener("loadeddata", requestFrame)
            else requestFrame()
        }
        else 
        {
            const framesNumber = (this._imgSource as VideoFrame[]).length;
            let frameIndex = 0;
            const drawFrame = () => {
                if(framesNumber === 0)
                    return;
                const frame = (this._imgSource as VideoFrame[])[frameIndex]
                const duration = frame.duration / 1000;
                this.draw(frame)
                frameIndex = (frameIndex + 1) % framesNumber;
                setTimeout(() => drawFrame(), duration);
            }
            drawFrame()
        }
        return canvas
    }
}

export default CachedImg
