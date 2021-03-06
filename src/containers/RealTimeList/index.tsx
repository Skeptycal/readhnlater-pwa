import * as React from 'react';
import { OrderedMap, List } from 'immutable';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import APIClient from '../../utils/APIClient';
import ListItem from '../../components/ListItem';
import ItemHeader, { ItemProperties } from '../../components/ItemHeader';
import { Actions } from '../../redux/Items';

interface Props {
  subscribeTo?: 'newest' | 'show' | 'ask' | 'jobs' | 'best';
  selectedItems: List<string>;
  items: OrderedMap<string, ItemProperties>;
  addItem: (s: ItemProperties) => void;
  setSelectedItems: (list: string[]) => void;
  setLoading: (b: boolean) => void;
}

class RealTimeList extends React.PureComponent<Props> {
  private API_LIMIT = 30;
  public componentDidMount() {
    // If selectedItems has previously been saved as string[], save it now as List<string>
    if (this.props.selectedItems.toJS === undefined) {
      this.props.setSelectedItems(this.props.selectedItems as any);
    }

    this.subscribe();
  }

  public componentWillUnmount(){
    APIClient.getInstance().removeListener();
  }

  public render() {
    const { selectedItems } = this.props;
    const items: string[] = selectedItems.toJS ? selectedItems.toJS() : selectedItems;

    return (
      <div style={{ background: '#f6f6ef' }}>
        <ListItem loading={this.props.selectedItems.size === 0}>
          {items.map((id: string, i: number) => {
            if (!this.props.items.has(id)) {
              return <ItemHeader id={parseInt(id, 10)} key={i} />;
            }
            return <ItemHeader {...this.props.items.get(id)} key={i} />
          })}
        </ListItem>
        <span
          onClick={this.onMore}
          style={{ padding: '0px 32px', cursor: 'pointer', fontSize: '10pt', color: '#828282' }}
        >
          More
           </span>
      </div>
    );
  }

  private onNewData = async (snapshot: firebase.database.DataSnapshot) => {
    this.props.setLoading(true);
    const items = snapshot.val().map((e: number) => e.toString()) || [];
    try {
      for (const id of items) {
        APIClient.getInstance().getItem(id).then((item: any) => {
          this.props.addItem(item.val());
        });
      }
      this.props.setSelectedItems(items);
    } catch (e) {
      console.error(e);
    }
    this.props.setLoading(false);
  };

  private subscribe = () => {
    this.props.setLoading(true);
    switch (this.props.subscribeTo) {
      case 'newest':
        APIClient.getInstance().subscribeToNewStories(this.onNewData, this.API_LIMIT);
        break;
      case 'show':
        APIClient.getInstance().subscribeToShowStories(this.onNewData, this.API_LIMIT);
        break;
      case 'ask':
        APIClient.getInstance().subscribeToAskStories(this.onNewData, this.API_LIMIT);
        break;
      case 'jobs':
        APIClient.getInstance().subscribeToJobStories(this.onNewData, this.API_LIMIT);
        break;
      case 'best':
        APIClient.getInstance().subscribeToBestStories(this.onNewData, this.API_LIMIT);
        break;
      default:
        APIClient.getInstance().subscribeToTopStories(this.onNewData, this.API_LIMIT);
        break;
    }
  }
  private onMore = () => {
    this.API_LIMIT += 30;
    this.subscribe();
  }
}


const mapStateToProps = (state: any) => {
  return {
    selectedItems: state.selected,
    items: state.items
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => ({
  addItem: (payload: ItemProperties) => dispatch({ type: Actions.ADD_ITEM, payload }),
  setSelectedItems: (payload: string[]) => dispatch({ type: Actions.SET_SELECTED_ITEMS, payload }),
  setLoading: (payload: boolean) => dispatch({ type: Actions.SET_LOADING, payload })
})

export default connect(mapStateToProps, mapDispatchToProps)(RealTimeList);