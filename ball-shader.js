const vBallSource = `#version 300 es
in vec3 a_position;
in vec2 a_texcoord;
in vec3 a_normal;

out highp vec3 v_normal;
out highp vec2 v_texcoord;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;

void main() {
    v_texcoord = a_texcoord;
    v_normal = (u_modelMatrix * vec4(a_normal, 0.0)).xyz;

    gl_Position = u_projectionMatrix * u_viewMatrix * u_modelMatrix * vec4(a_position, 1.0);
}
`;

const fBallSource = `#version 300 es

in highp vec3 v_normal;
in highp vec2 v_screenpos;
in highp vec2 v_texcoord;

out highp vec4 v_out_color;

uniform sampler2D u_texture;

void main() {
    highp vec4 out_color = texture(u_texture, v_texcoord);
    if (out_color.a < 0.5) discard;
    v_out_color = out_color;
}
`;