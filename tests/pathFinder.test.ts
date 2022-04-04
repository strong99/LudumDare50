import { Vector2 } from '../src/vector2'
import { ClassicPathfinder, IWorld, IChunk, ITile } from '../src/pathfinding/classicPathfinder'
import { ModernPathfinder } from '../src/pathfinding/modernPathfinder'

interface Tile extends ITile<Tile> {}

/**
 * Test tile setup, used in world creation in the beforeAll
 */
const tiles = [
    [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
    [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ],
    [ 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1 ],
    [ 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1 ],
    [ 1, 0, 1, 0, 1, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1 ],
    [ 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1 ],
    [ 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1 ],
    [ 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ],
    [ 1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 1 ],
    [ 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 ],
    [ 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
    [ 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1 ],
    [ 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1 ],
    [ 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 0, 1 ],
    [ 1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 0, 0, 1, 0, 1 ],
    [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ]
];

describe('test the pathfinder', ()=>{
    /// Test the classic and the refactorred version of the pathfinder here.
    /// The classic/original method used expensive find methods, were the new
    /// pathfinder uses basic javascript look up with an index table.
    /// The difference should around 9/10th (90%).

    /// As we also test basic performance, repeat count to repeat the logic x times
    /// The difference in duration should only be compared on significant differences.
    /// A result of 5ms, or 10% is not enouogh to compare. The test durations can 
    /// differ up to 10% every run.
    const repeatCount = 40;

    /// Create a basic test world with a chunk and tiles
    let world: IWorld<IChunk<Tile>, Tile> = { chunks: [[{tiles:[], position: new Vector2(0,0) }]] };
    beforeAll(()=>{
        const chunk = world.chunks[0][0];
        const newTiles: Tile[][] = [];
        for(let x = 0; x < tiles.length; x++) {
            const xRow = tiles[x];
            const yLength = xRow.length;
            newTiles[x] = [];
            for(let y = 0; y < yLength; y++) {
                newTiles[x].push({
                    type: 'grass',
                    solid: tiles[x][y] ? true : false,
                    position: new Vector2(x, y),
                    globalPosition: new Vector2(x, y),
                    neighbours: []
                });
            }
        }
        chunk.tiles = newTiles;

        for(let x = 0; x < tiles.length; x++) {
            const xRow = tiles[x];
            const yLength = xRow.length;
            for(let y = 0; y < yLength; y++) {
                chunk.tiles[x][y].neighbours = [
                    x - 1 >= 0 ? chunk.tiles[x - 1][y] : null,
                    x + 1 < chunk.tiles.length ? chunk.tiles[x + 1][y] : null,
                    y - 1 >= 0 ? chunk.tiles[x][y - 1] : null,
                    y + 1 < yLength ? chunk.tiles[x][y + 1] : null,
                ].filter(p=>p !== null) as Tile[];
            }
        }
    });

    it('classic pathfinder', () => {
        const pathfinder = new ClassicPathfinder(world);

        const start = Date.now();
        let path: Tile[]|null = null;
        
        // repeat path finding to also check the methods duration
        for(let i = 0; i < repeatCount; i++)
            path = pathfinder.findPath(new Vector2(1,1), new Vector2(14, 14));

        const end = Date.now();
        const diff = end - start;
        console.log(`Classic pathfinder: ${diff}ms`);

        expect(path).not.toBeNull();
        if (path) {
            expect(path.length).toBe(41);
            expect(path[0].position.x).toBe(1);
            expect(path[0].position.y).toBe(1);
            expect(path[path.length - 1].position.x).toBe(14);
            expect(path[path.length - 1].position.y).toBe(14);
        }
    });

    it('modern pathfinder', () => {
        const pathfinder = new ModernPathfinder(world);

        const start = Date.now();
        let path: Tile[]|null = null;

        // repeat path finding to also check the methods duration
        for(let i = 0; i < repeatCount; i++)
            path = pathfinder.findPath(new Vector2(1,1), new Vector2(14, 14));

        const end = Date.now();
        const diff = end - start;
        console.log(`Modern pathfinder: ${diff}ms`);

        expect(path).not.toBeNull();
        if (path) {
            expect(path.length).toBe(41);
            expect(path[0].position.x).toBe(1);
            expect(path[0].position.y).toBe(1);
            expect(path[path.length - 1].position.x).toBe(14);
            expect(path[path.length - 1].position.y).toBe(14);
        }
    });
});