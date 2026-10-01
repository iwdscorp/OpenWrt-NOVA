// Read-only native ubus sample for replay tests. No HTTP/browser requests.
import { connect } from 'ubus';
let bus = connect();
let status = bus.call('network.device', 'status', {});
let dump = bus.call('network.interface', 'dump', {});
let info = bus.call('system', 'info', {});
if (!status || !dump || !info) die('Cannot collect native telemetry\n');
print(sprintf('%J\n', { time: time() * 1000, status, dump: dump.interface, info }));
