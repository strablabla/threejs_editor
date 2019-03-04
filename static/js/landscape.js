function Visu3d(detail) {
    this.size = Math.pow(2, detail) + 1;
    this.max = this.size - 1;
    this.map = new Float32Array(this.size * this.size);
}

Visu3d.prototype.get = function (x, y) {
    if (x < 0 || x > this.max || y < 0 || y > this.max) return -1;
    return this.map[x + this.size * y];
};

Visu3d.prototype.set = function (x, y, val) {
    this.map[x + this.size * y] = val;
};

Visu3d.prototype.generate = function () {
    var self = this;
    this.set(0, 0, self.max);
    this.set(this.max, 0, self.max / 2);
    this.set(this.max, this.max, 0);
    this.set(0, this.max, self.max / 2);
    for (var i=0; i< data.length;i++) {
      self.get(data[i].x, data[i].y);
      self.set(data[i].x, data[i].y, data[i].z);
    }
}

Visu3d.prototype.addMesh = function (wall_material) {
    var self = this;
    var geometry = new THREE.PlaneGeometry(512, 512, this.size - 1, this.size - 1);
    var min_height = Infinity;
    var max_height = -Infinity;
    for (var y = 0; y < this.size; y++) {
        for (var x = 0; x < this.size; x++) {
            var height_val = this.get(x, y);
            if ( height_val < min_height ) min_height = height_val;
            if ( height_val > max_height ) max_height = height_val;
            if ( height_val < 0 ) height_val = 0;
            if (y === 0 || y === this.size - 1 || x === 0 || x === this.size - 1) height_val = 0.0;
            geometry.vertices[y * this.size + x].z = height_val;
        }
    }

    geometry.computeFaceNormals();
    geometry.computeVertexNormals();
    scene.remove(mesh);
    //var wall_material = 'Decor/mur_crepi.jpg'
    material  = new THREE.MeshBasicMaterial({ map: THREE.ImageUtils.loadTexture(wall_material), overdraw: true, receiveShadow : true  });
    mesh = new THREE.Mesh(geometry, material); //MeshNormalMaterial
    mesh.rotation.x = -Math.PI / 2.0;
    scene.add(mesh);
}
