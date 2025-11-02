import * as React from "react"
import { RSSItem } from "../../scripts/models/item"
import CachedImg from "./cached-img"

type CardThumbnailProps = {
    item: RSSItem
    className?: string
    allowVideo?: boolean
}

const videoExtensions = ["mp4", "webm", "mkv", "mov"]

const isVideo = (url: string) => {
    const extensionSearch = /\.(\w{3,4})(?:$|\?)/.exec(url)
    return (
        extensionSearch &&
        extensionSearch.length > 1 &&
        videoExtensions.includes(extensionSearch[1])
    )
}

const mediaElement = (props: CardThumbnailProps) => {
    if (!isVideo(props.item.thumb)) {
        // return <img className={props.className} src={props.item.thumb}></img>
        return (
            <CachedImg
                src={props.item.thumb}
                className={props.className}></CachedImg>
        )
    }
    if (props.allowVideo) {
        return (
            <video
                className={props.className}
                src={props.item.thumb}
                muted
                autoPlay
                loop></video>
        )
    }
    return null
}

const CardThumbnail: React.FunctionComponent<CardThumbnailProps> = props =>
    props.item.thumb ? mediaElement(props) : null
export default CardThumbnail
