{
    let obj = `
v 1.000000 1.000000 -1.000000
v 1.000000 -1.000000 -1.000000
v 1.000000 1.000000 1.000000
v 1.000000 -1.000000 1.000000
v -1.000000 1.000000 -1.000000
v -1.000000 -1.000000 -1.000000
v -1.000000 1.000000 1.000000
v -1.000000 -1.000000 1.000000
vn -0.0000 1.0000 -0.0000
vn -0.0000 -0.0000 1.0000
vn -1.0000 -0.0000 -0.0000
vn -0.0000 -1.0000 -0.0000
vn 1.0000 -0.0000 -0.0000
vn -0.0000 -0.0000 -1.0000
vt 0.625000 0.500000
vt 0.375000 0.500000
vt 0.625000 0.750000
vt 0.375000 0.750000
vt 0.875000 0.500000
vt 0.625000 0.250000
vt 0.125000 0.500000
vt 0.375000 0.250000
vt 0.875000 0.750000
vt 0.625000 1.000000
vt 0.625000 0.000000
vt 0.375000 0.000000
vt 0.375000 1.000000
vt 0.125000 0.750000
s 0
f 5/5/1 3/3/1 1/1/1
f 3/3/2 8/13/2 4/4/2
f 7/11/3 6/8/3 8/12/3
f 2/2/4 8/14/4 6/7/4
f 1/1/5 4/4/5 2/2/5
f 5/6/6 2/2/6 6/8/6
f 5/5/1 7/9/1 3/3/1
f 3/3/2 7/10/2 8/13/2
f 7/11/3 5/6/3 6/8/3
f 2/2/4 4/4/4 8/14/4
f 1/1/5 3/3/5 4/4/5
f 5/6/6 1/1/6 2/2/6
    `;

    let lines = obj.split("\n");
    let positions = [];
    let texcoords = [];
    let normals = [];

    let o_pos = [];
    let o_tex = [];
    let o_norm = [];
    let o_ind = [];
    let uniq = {};
    let idx = 0;

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith("v ")) {
            let vertexData = lines[i].split(" ");
            positions.push([Number(vertexData[1]), Number(vertexData[2]), Number(vertexData[3])]);
        } else if (lines[i].startsWith("vt ")) {
            let vertexData = lines[i].split(" ");
            texcoords.push([Number(vertexData[1]), Number(vertexData[2])]);
        } else if (lines[i].startsWith("vn ")) {
            let vertexData = lines[i].split(" ");
            normals.push([Number(vertexData[1]), Number(vertexData[2]), Number(vertexData[3])]);
        } else if (lines[i].startsWith("f ")) {
            let faceData = lines[i].split(" ");
            for (let j = 1; j < faceData.length; j++) {
                if (faceData[j] in uniq) {
                    o_ind.push(uniq[faceData[j]]);
                } else {
                    uniq[faceData[j]] = idx;
                    o_ind.push(idx++);
                    let attribs = faceData[j].split("/");
                    o_pos.push(positions[Number(attribs[0]) - 1][0]);
                    o_pos.push(positions[Number(attribs[0]) - 1][1]);
                    o_pos.push(positions[Number(attribs[0]) - 1][2]);
                    o_tex.push(texcoords[Number(attribs[1]) - 1][0]);
                    o_tex.push(texcoords[Number(attribs[1]) - 1][1]);
                    o_norm.push(normals[Number(attribs[2]) - 1][0]);
                    o_norm.push(normals[Number(attribs[2]) - 1][1]);
                    o_norm.push(normals[Number(attribs[2]) - 1][2]);
                }
            }
        }
    }

    let model = {
        position: o_pos,
        texcoord: o_tex,
        normal: o_norm,
        indices: o_ind,
    }

    console.log(model);
}