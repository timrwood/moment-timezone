import moment from 'moment';
import attach from './moment/attach';
import packed from './data/packed-2010-2020';

attach(moment).load(packed);

export default moment;
