import { Dialog, DialogContent, DialogTitle, Divider, Tab, Tabs, Tooltip } from "@material-ui/core"
import * as React from "react"
import { connect } from "react-redux"
import { Replay } from "../../../Models"
import { StoreState } from "../../../Redux"
import { deleteTag, getAllTags } from "../../../Requests/Tag"
import { LoadableWrapper } from "../LoadableWrapper"
import { ReplayTagDisplay } from "./ReplayTagDisplay"
import { UserTagDisplay } from "./UserTagDisplay"

const mapStateToProps = (state: StoreState) => ({
    loggedInUser: state.loggedInUser
})

type TagTab = "Replay" | "My tags"

interface OwnProps {
    open: boolean,
    onClose: React.ReactEventHandler<{}>
    replay: Replay
    handleUpdateTags: (tags: Tag[]) => void
}

type Props = OwnProps
    & ReturnType<typeof mapStateToProps>

interface State {
    selectedTab: TagTab
    userTags?: Tag[]
}

class TagDialogComponent extends React.PureComponent<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = {selectedTab: "Replay"}
    }

    public render() {
        return (
            <Dialog
                open={this.props.open}
                onClose={this.props.onClose}
                scroll="paper"
                PaperProps={{style: {width: 360, maxWidth: "90vw"}}}
                onClick={this.stopPropagation}
            >
                <DialogTitle style={{padding: 0}}>
                    <Tabs
                        value={this.state.selectedTab}
                        onChange={this.handleTabChange}
                        centered
                    >
                        <Tab label={"Replay"} value={"Replay"}/>
                        {this.props.loggedInUser !== null ? (
                            <Tab label={"My tags"} value={"My tags"}/>
                        ) : (
                            <Tooltip title="Log in to view your tabs">
                                <div>
                                    <Tab label={"My tags"} value={"My tags"} disabled/>
                                </div>
                            </Tooltip>
                        )}
                    </Tabs>
                    <Divider/>
                </DialogTitle>
                <DialogContent>
                    {this.props.loggedInUser !== null ? (
                        <LoadableWrapper load={this.loadUserTags}>
                            {this.state.userTags && (
                                this.state.selectedTab === "Replay" ?
                                    <ReplayTagDisplay
                                        replay={this.props.replay}
                                        userTagProps={{
                                            userTags: this.state.userTags,
                                            handleUpdateTags: this.props.handleUpdateTags
                                        }}
                                    />
                                    :
                                    <UserTagDisplay
                                        tags={this.state.userTags}
                                        handleCreate={this.handleCreateUserTag}
                                        deleteTag={this.deleteTag}
                                    />
                            )}
                        </LoadableWrapper>
                    ) : (
                        <ReplayTagDisplay replay={this.props.replay}/>
                    )}
                </DialogContent>
            </Dialog>
        )
    }

    private readonly handleTabChange = (_: React.ChangeEvent<{}>, selectedTab: TagTab) => {
        this.setState({selectedTab})
    }

    private readonly loadUserTags = (): Promise<void> => {
        return getAllTags()
            .then((userTags) => this.setState({userTags}))
    }

    private readonly handleCreateUserTag = (tag: Tag) => {
        if (this.state.userTags) {
            const tagNameAlreadyExists = this.state.userTags.map((testTag) => testTag.name)
                .indexOf(tag.name) !== -1
            if (tagNameAlreadyExists) {
                return
            }
        }

        this.setState({
            userTags: [...this.state.userTags || [], tag]
        })
    }

    private readonly deleteTag = (tag: Tag) => () => {
        if (this.state.userTags !== undefined) {
            deleteTag(tag.name)
                .then(() => {
                    this.setState({
                        userTags: this.state.userTags!.filter((testTag) => !(testTag.name === tag.name))
                    })
                })
        }
    }

    private readonly stopPropagation: React.MouseEventHandler = (event) => {
        event.stopPropagation()
    }
}

export const TagDialog = connect(mapStateToProps)(TagDialogComponent)
