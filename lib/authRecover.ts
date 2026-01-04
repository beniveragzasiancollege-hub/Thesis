let inRecovery = false;

export const setInRecovery = (value: boolean) => {
  inRecovery = value;
};

export const isInRecovery = () => inRecovery;
