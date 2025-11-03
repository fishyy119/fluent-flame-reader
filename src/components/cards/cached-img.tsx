import * as React from "react"

type ImgProps = {
    src: string
    className?: string
}

class CachedImg extends React.Component<ImgProps> {
    private static readonly _cache = new Map<
        string,
        HTMLImageElement | HTMLVideoElement
    >()
    private static readonly videoExtensions = ["mp4", "webm", "mkv", "mov"]
    private readonly _canvasRef = React.createRef<HTMLCanvasElement>()
    private readonly _maxCanvasDimension = 256
    private _needsRescaling: boolean = true
    private _imgSource: HTMLImageElement | HTMLVideoElement | null = null

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
    private draw() {
        const canvas = this._canvasRef.current
        if (!canvas || !this._imgSource) {
            return
        }
        const width =
            this._imgSource instanceof HTMLImageElement
                ? this._imgSource.naturalWidth
                : this._imgSource.videoWidth
        const height =
            this._imgSource instanceof HTMLImageElement
                ? this._imgSource.naturalHeight
                : this._imgSource.videoHeight
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
            this._imgSource,
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
            } else {
                this._imgSource = new Image()
                this._imgSource.loading = "eager"
            }
            CachedImg._cache.set(this.props.src, this._imgSource)
            this._imgSource.src = this.props.src
        }
        if (this._imgSource instanceof HTMLImageElement) {
            this._imgSource
                .decode()
                .then(() => this.draw())
                .catch(() => this.forceUpdate())
        } else {
            const requestFrame = () => {
                this.draw()
                ;(
                    this._imgSource as HTMLVideoElement
                ).requestVideoFrameCallback(requestFrame)
            }
            if (this._imgSource.readyState < this._imgSource.HAVE_CURRENT_DATA)
                this._imgSource.addEventListener("loadeddata", requestFrame)
            else requestFrame()
        }
        return canvas
    }
}

export default CachedImg
