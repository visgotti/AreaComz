Lightweight library using ZeroMQ that I'm going to be working on. The goal is
to create a system that supports extremely large-scale maps by breaking
down each client into an area.

This consists of keeping client sessions almost completely unstateful, the only
state of a client is which area it's communicating with as well as a small buffer of inputs
from clients if you receive them faster than you relay them to the area server. After you relay them they
will be left for garbage collection to clean up.

This is NOT a websocket library. It's meant for whatever server your websockets
are running on to relay your clients data to a backend server which isolates game
business logic without worrying about the clients connection. All it cares about
is which area the client is in.

It's still in very early stages but I plan on building it up as I continue to work
on my game which relies on large maps with synchronized player and world entities.


As of right now the plan is to have some sort of config file that lists your
available servers/ports in which you want each process to run on and then
the library will do the rest.

Will create a visualization of the data flow eventually so it's easier to understand

But it basically goes like this

N = # of areas you're splitting your game into

[ Connector ] > has N [ Channels ]
Channels are where the client sessions are stored and
basically by isolating client sessions into channels
that map 1:1 to an area server, the rest of the data-flow
is pretty trivial. Dumbed down it's basically just
many Channels that live on a Connector process communicating
with an Area that lives on its own process.

btw

I AM STILL UNSURE HOW EXACTLY SOME THINGS WILL WIND UP BEING IMPLEMENTED SO
MOST FUNCTIONS WILL PROBABLY WIND UP BEING COMPLETELY REFACTORED AND CHANGED
AS I BUILD THIS SYSTEM. ANY HELP/ADVICE IS GREATLY APPRECIATED :)