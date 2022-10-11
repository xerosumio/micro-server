const list = ({ data: { from } }) => {
  return {
    from,
    data: [
      {
        name: "jason",
      },
    ],
  };
};

module.exports = { list };
